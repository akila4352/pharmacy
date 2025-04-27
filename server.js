require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://akilanirmal2020:d1QbcRXU2aS10Dqe@cluster0.rm7l3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    firstName: String,
    lastName: String,
    username: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: String,
    role: {
        type: String,
        enum: ['patient', 'pharmacy', 'admin'],
        default: 'patient'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    pharmacyDetails: {
        pharmacyName: String,
        address: String,
        medicineName: String,
        price: Number,
        latitude: String,
        longitude: String,
        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Password hash
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Pharmacy Schema
const pharmacySchema = new mongoose.Schema({
    name: String,
    address: String,
    medicineName: String,
    price: Number,
    isAvailable: { type: Boolean, default: true },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

pharmacySchema.index({ location: '2dsphere' });
const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

// Auth Middleware
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token provided' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const {
            firstName, lastName, username, email, password, phone, role,
            adminCode, pharmacyName, address, medicineName,
            price, latitude, longitude, isAvailable
        } = req.body;

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'User already exists' });
        }

        if (role === 'admin' && adminCode !== '1234') {
            return res.status(400).json({ message: 'Invalid admin code' });
        }

        if (role === 'pharmacy') {
            if (!pharmacyName || !address || !medicineName || !price || !latitude || !longitude) {
                return res.status(400).json({ message: 'All pharmacy fields are required' });
            }
        }

        const newUser = new User({
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            username,
            email,
            password,
            phone,
            role,
            isActive: true,
            ...(role === 'pharmacy' && {
                pharmacyDetails: {
                    pharmacyName,
                    address,
                    medicineName,
                    price,
                    latitude,
                    longitude,
                    isAvailable
                }
            })
        });

        await newUser.save();
        
        // If user is a pharmacy owner, create a pharmacy entry as well
        if (role === 'pharmacy') {
            const newPharmacy = new Pharmacy({
                name: pharmacyName,
                address,
                medicineName,
                price: parseFloat(price),
                isAvailable: isAvailable !== false,
                ownerId: newUser._id,
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                }
            });
            await newPharmacy.save();
        }
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        if (user.role !== role) {
            return res.status(401).json({
                message: 'Invalid role selected. Please select the correct role for your account.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                message: 'Your account has been deactivated. Please contact administrator.'
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                name: user.name
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Pharmacy Owners - FIXED
app.get('/api/users/pharmacy-owners', async (req, res) => {
    try {
        const owners = await User.find({ role: 'pharmacy' }).select('-password');
        
        // Get pharmacy count for each owner
        const ownersWithCount = await Promise.all(owners.map(async (owner) => {
            const count = await Pharmacy.countDocuments({ ownerId: owner._id });
            return {
                ...owner.toObject(),
                pharmacyCount: count
            };
        }));
        
        res.json(ownersWithCount);
    } catch (err) {
        console.error('Error fetching pharmacy owners:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get User by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        // Ensure valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
    try {
        // Ensure valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const { name, email, phone, role, firstName, lastName } = req.body;
        
        // Build update object
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (role) updateData.role = role;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');
        
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
    try {
        // Ensure valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        
        // Also delete associated pharmacies if user is a pharmacy owner
        if (deletedUser.role === 'pharmacy') {
            await Pharmacy.deleteMany({ ownerId: deletedUser._id });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User Status (Activate/Deactivate)
app.put('/api/users/:id/status', async (req, res) => {
    try {
        // Ensure valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const { isActive } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');
        
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Pharmacies
app.get('/api/pharmacies', async (req, res) => {
    try {
        const pharmacies = await Pharmacy.find()
            .populate('ownerId', 'name email phone'); // Populate owner details
        res.json(pharmacies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Pharmacies by Owner
app.get('/api/pharmacies/owner/:ownerId', async (req, res) => {
    try {
        // Ensure valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.ownerId)) {
            return res.status(400).json({ message: 'Invalid owner ID format' });
        }
        
        const pharmacies = await Pharmacy.find({ ownerId: req.params.ownerId });
        res.json(pharmacies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search Nearby Pharmacies
app.get('/api/pharmacies/search', async (req, res) => {
    try {
        const { latitude, longitude, medicineName } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        let query = {
            isAvailable: true,
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: 10000 // 10km
                }
            }
        };
        
        // Add medicine name filter if provided
        if (medicineName) {
            query.medicineName = new RegExp(medicineName, 'i');
        }

        const pharmacies = await Pharmacy.find(query)
            .populate('ownerId', 'name email phone');

        res.json(pharmacies);
    } catch (err) {
        console.error('Error searching pharmacies:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get Pharmacy by ID
app.get('/api/pharmacies/:id', async (req, res) => {
    try {
        // Ensure valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid pharmacy ID format' });
        }
        
        const pharmacy = await Pharmacy.findById(req.params.id)
            .populate('ownerId', 'name email phone');
            
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        res.json(pharmacy);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Pharmacy
app.post('/api/pharmacies', async (req, res) => {
    try {
        const { name, address, medicineName, price, isAvailable, ownerId, latitude, longitude } = req.body;
        
        // Ensure valid ObjectId for owner
        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
            return res.status(400).json({ message: 'Invalid owner ID format' });
        }
        
        // Check if owner exists and has pharmacy role
        const owner = await User.findById(ownerId);
        if (!owner) {
            return res.status(404).json({ message: 'Owner not found' });
        }
        if (owner.role !== 'pharmacy') {
            return res.status(400).json({ message: 'User is not a pharmacy owner' });
        }
        
        // Create new pharmacy with coordinates directly
        const pharmacy = new Pharmacy({
            name,
            address,
            medicineName,
            price: parseFloat(price),
            isAvailable: Boolean(isAvailable),
            ownerId,
            location: {
                type: 'Point',
                coordinates: [
                    parseFloat(longitude), 
                    parseFloat(latitude)
                ]
            }
        });
        
        await pharmacy.save();
        res.status(201).json(pharmacy);
    } catch (err) {
        console.error('Error creating pharmacy:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update Pharmacy
app.put('/api/pharmacies/:id', async (req, res) => {
    try {
        // Ensure valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid pharmacy ID format' });
        }
        
        const { name, address, medicineName, price, isAvailable, latitude, longitude } = req.body;
        
        const updateData = {};
        if (name) updateData.name = name;
        if (address) updateData.address = address;
        if (medicineName) updateData.medicineName = medicineName;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);
        
        // Update location if coordinates provided
        if (latitude !== undefined && longitude !== undefined) {
            updateData.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
        }
        
        const updated = await Pharmacy.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true }
        );
        
        if (!updated) return res.status(404).json({ message: 'Pharmacy not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Pharmacy
app.delete('/api/pharmacies/:id', async (req, res) => {
    try {
        // Ensure valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid pharmacy ID format' });
        }
        
        const deleted = await Pharmacy.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Pharmacy not found' });
        
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Pharmacy Statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalPharmacies = await Pharmacy.countDocuments();
        const availableMedicines = await Pharmacy.countDocuments({ isAvailable: true });
        const totalUsers = await User.countDocuments();
        const totalOwners = await User.countDocuments({ role: 'pharmacy' });
        
        // Get unique medicine names
        const medicines = await Pharmacy.distinct('medicineName');
        
        res.json({
            totalPharmacies,
            totalMedicines: medicines.length,
            availableMedicines,
            totalUsers,
            totalOwners
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));