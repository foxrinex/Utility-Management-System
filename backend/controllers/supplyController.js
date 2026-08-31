const Supply = require('../models/Supply');
const ShipmentLog = require('../models/ShipmentLog');

// --- DEFAULT UTILITY SUPPLY SEED DATA ---
const DEFAULT_SUPPLIES = [
  { name: '500 kVA Step-Down Transformer', sku: 'TRF-500KVA', category: 'Transformers', quantity: 12, unit: 'units', minThreshold: 3 },
  { name: '100 kVA Distribution Transformer', sku: 'TRF-100KVA', category: 'Transformers', quantity: 8, unit: 'units', minThreshold: 2 },
  { name: 'Copper Ground Cable (4mm²)', sku: 'CBL-CU-4MM', category: 'Cabling', quantity: 500, unit: 'meters', minThreshold: 100 },
  { name: 'Aluminum Overhead Cable (16mm²)', sku: 'CBL-AL-16MM', category: 'Cabling', quantity: 300, unit: 'meters', minThreshold: 80 },
  { name: 'Smart Electric Meter (Single Phase)', sku: 'MTR-SM-SP', category: 'Smart Meters', quantity: 45, unit: 'units', minThreshold: 10 },
  { name: 'Smart Electric Meter (Three Phase)', sku: 'MTR-SM-TP', category: 'Smart Meters', quantity: 20, unit: 'units', minThreshold: 5 },
  { name: '100A MCCB Circuit Breaker', sku: 'CBR-MCCB-100A', category: 'Circuit Breakers', quantity: 30, unit: 'units', minThreshold: 8 },
  { name: '63A Miniature Circuit Breaker', sku: 'CBR-MCB-63A', category: 'Circuit Breakers', quantity: 55, unit: 'units', minThreshold: 15 },
  { name: 'MV Switchgear Panel', sku: 'SUB-SWGR-MV', category: 'Substation Parts', quantity: 4, unit: 'units', minThreshold: 1 },
  { name: 'Insulated Linesman Gloves (Class 2)', sku: 'SFT-GLVS-C2', category: 'Safety Gear', quantity: 80, unit: 'pairs', minThreshold: 20 },
  { name: 'Arc Flash Helmet', sku: 'SFT-HLMT-AF', category: 'Safety Gear', quantity: 15, unit: 'units', minThreshold: 5 },
  { name: 'Digital Multimeter (HV-rated)', sku: 'TLS-DMM-HV', category: 'Tools', quantity: 10, unit: 'units', minThreshold: 3 },
];

// --- GET ALL SUPPLIES (with auto-seed if empty) ---
exports.getAllSupplies = async (req, res) => {
  try {
    let supplies = await Supply.find().sort({ category: 1, name: 1 });

    // Auto-seed default utility supply items if database is empty
    if (supplies.length === 0) {
      await Supply.insertMany(DEFAULT_SUPPLIES);
      supplies = await Supply.find().sort({ category: 1, name: 1 });
    }

    res.status(200).json(supplies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching supplies', error: error.message });
  }
};

// --- CREATE NEW SUPPLY CATALOG ITEM ---
exports.createSupply = async (req, res) => {
  try {
    const { name, sku, category, quantity, unit, minThreshold } = req.body;

    if (!name || !sku || !category) {
      return res.status(400).json({ message: 'Name, SKU, and category are required.' });
    }

    const existingSku = await Supply.findOne({ sku: sku.trim().toUpperCase() });
    if (existingSku) {
      return res.status(400).json({ message: 'A supply item with this SKU already exists.' });
    }

    const newSupply = new Supply({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      quantity: quantity || 0,
      unit: unit || 'units',
      minThreshold: minThreshold || 10
    });

    await newSupply.save();
    res.status(201).json(newSupply);
  } catch (error) {
    res.status(500).json({ message: 'Error creating supply item', error: error.message });
  }
};

// --- RECORD BULK SHIPMENT ARRIVAL (increments stock count atomically) ---
exports.recordShipment = async (req, res) => {
  try {
    const { supplyId, quantityReceived, supplier, invoiceRef, notes, receivedBy, receivedById } = req.body;

    if (!supplyId || !quantityReceived || !supplier || !receivedBy) {
      return res.status(400).json({ message: 'Supply item, quantity, supplier, and receiver name are required.' });
    }

    const qty = parseInt(quantityReceived, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity received must be a positive integer.' });
    }

    // Find the supply item first to get name/sku for the log
    const supply = await Supply.findById(supplyId);
    if (!supply) {
      return res.status(404).json({ message: 'Supply item not found.' });
    }

    // Atomically increment stock quantity and update shipment metadata
    const updatedSupply = await Supply.findByIdAndUpdate(
      supplyId,
      {
        $inc: { quantity: qty },
        $set: {
          lastSupplier: supplier.trim(),
          lastShipmentAmount: qty,
          updatedBy: receivedBy,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    // Write audit log entry
    const logEntry = new ShipmentLog({
      supplyId: supply._id,
      supplyName: supply.name,
      supplySku: supply.sku,
      quantityReceived: qty,
      supplier: supplier.trim(),
      invoiceRef: invoiceRef ? invoiceRef.trim() : '',
      receivedBy,
      receivedById: receivedById || '',
      notes: notes ? notes.trim() : ''
    });

    await logEntry.save();

    res.status(200).json({
      message: `Shipment recorded. Stock for "${supply.name}" updated from ${updatedSupply.quantity - qty} → ${updatedSupply.quantity} ${supply.unit}.`,
      supply: updatedSupply,
      log: logEntry
    });
  } catch (error) {
    res.status(500).json({ message: 'Error recording shipment', error: error.message });
  }
};

// --- GET SHIPMENT HISTORY (most recent first) ---
exports.getShipmentHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = await ShipmentLog.find().sort({ receivedAt: -1 }).limit(limit);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shipment history', error: error.message });
  }
};

// --- UPDATE SUPPLY ITEM (edit details or adjust quantity directly) ---
exports.updateSupply = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category, quantity, unit, minThreshold, updatedBy } = req.body;

    // Validate that the supply item exists
    const existing = await Supply.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Supply item not found.' });
    }

    // If SKU is being changed, ensure the new SKU is not already taken by another item
    if (sku && sku.trim().toUpperCase() !== existing.sku) {
      const skuConflict = await Supply.findOne({ sku: sku.trim().toUpperCase(), _id: { $ne: id } });
      if (skuConflict) {
        return res.status(400).json({ message: 'Another supply item already uses this SKU.' });
      }
    }

    // Build the update payload with only the provided fields
    const updateFields = { updatedAt: new Date() };
    if (name !== undefined)         updateFields.name = name.trim();
    if (sku !== undefined)          updateFields.sku = sku.trim().toUpperCase();
    if (category !== undefined)     updateFields.category = category;
    if (quantity !== undefined)     updateFields.quantity = Math.max(0, parseInt(quantity, 10));
    if (unit !== undefined)         updateFields.unit = unit.trim();
    if (minThreshold !== undefined) updateFields.minThreshold = Math.max(0, parseInt(minThreshold, 10));
    if (updatedBy !== undefined)    updateFields.updatedBy = updatedBy;

    const updated = await Supply.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    res.status(200).json({ message: 'Supply item updated successfully.', supply: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating supply item', error: error.message });
  }
};
