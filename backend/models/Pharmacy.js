const mongoose = require('mongoose');

const pharmacyInventoryItemSchema = new mongoose.Schema({
  medicineName: { type: String, required: true, trim: true },
  brandName: { type: String, trim: true },
  dosageForm: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Cream', 'Drops', 'Sachet', 'Inhaler', 'Other'],
    default: 'Tablet'
  },
  strength: { type: String, required: true, trim: true }, // e.g. '500mg', '10mg'
  inStock: { type: Boolean, default: true },
  quantity: { type: Number, default: 50, min: 0 },
  price: { type: Number, default: 0 }
}, { _id: false });

const pharmacySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, default: 'New Delhi' },
  pincode: { type: String, default: '110029' },
  phone: { type: String, required: true, trim: true },
  operatingHours: { type: String, default: '09:00 AM - 09:00 PM' },
  rating: { type: Number, default: 4.5, min: 1, max: 5 },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] GeoJSON
      required: true
    }
  },
  inventory: [pharmacyInventoryItemSchema],
  isSimulated: { type: Boolean, default: true }
}, { timestamps: true });

// 2dsphere index for geospatial queries
pharmacySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
