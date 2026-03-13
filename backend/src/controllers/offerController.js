const updateItemPrices = async (MenuItem, itemIds, discountPercentage, isRevert = false) => {
    for (const itemId of itemIds) {
        try {
            const item = await MenuItem.findById(itemId);
            if (item) {
                if (isRevert) {
                    if (item.originalPrice !== undefined && item.originalPrice !== null) {
                        item.price = item.originalPrice;
                        item.originalPrice = undefined;
                        await item.save();
                    }
                } else {
                    // Only save original price if not already set
                    if (item.originalPrice === undefined || item.originalPrice === null) {
                        item.originalPrice = item.price;
                    }
                    const discount = (item.originalPrice * (discountPercentage || 0)) / 100;
                    item.price = Math.round((item.originalPrice - discount) * 100) / 100;
                    await item.save();
                }
            }
        } catch (error) {
            console.error(`Error updating price for item ${itemId}:`, error);
        }
    }
};

const getOffers = async (req, res) => {
    try {
        const { Offer } = req.tenantModels;
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.status(200).json(offers);
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ message: 'Failed to fetch offers' });
    }
};

const createOffer = async (req, res) => {
    try {
        const { Offer, MenuItem } = req.tenantModels;
        const newOffer = new Offer(req.body);
        const savedOffer = await newOffer.save();

        // Apply discount if active and has items
        if (savedOffer.status === 'ACTIVE' && savedOffer.applicableItems && savedOffer.applicableItems.length > 0) {
            await updateItemPrices(MenuItem, savedOffer.applicableItems, savedOffer.discountPercentage);
        }

        // Broadcast via socket if configured
        const reqIO = req.app.get('io');
        if (reqIO) {
            reqIO.to(req.tenantDbName).emit('offersUpdated');
            reqIO.to(req.tenantDbName).emit('menuUpdated', { action: 'bulkUpdate' });
        }

        res.status(201).json(savedOffer);
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ message: 'Failed to create offer' });
    }
};

const updateOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { Offer, MenuItem } = req.tenantModels;

        const oldOffer = await Offer.findById(id);
        if (!oldOffer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Always revert old first to be safe
        if (oldOffer.applicableItems && oldOffer.applicableItems.length > 0) {
            await updateItemPrices(MenuItem, oldOffer.applicableItems, oldOffer.discountPercentage, true);
        }

        const updatedOffer = await Offer.findByIdAndUpdate(id, req.body, { new: true });

        // Apply new if active
        if (updatedOffer.status === 'ACTIVE' && updatedOffer.applicableItems && updatedOffer.applicableItems.length > 0) {
            await updateItemPrices(MenuItem, updatedOffer.applicableItems, updatedOffer.discountPercentage);
        }

        // Broadcast
        const reqIO = req.app.get('io');
        if (reqIO) {
            reqIO.to(req.tenantDbName).emit('offersUpdated');
            reqIO.to(req.tenantDbName).emit('menuUpdated', { action: 'bulkUpdate' });
        }

        res.status(200).json(updatedOffer);
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ message: 'Failed to update offer' });
    }
};

const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { Offer, MenuItem } = req.tenantModels;

        const offerToDelete = await Offer.findById(id);
        
        if (!offerToDelete) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Revert prices before deleting if active
        if (offerToDelete.status === 'ACTIVE' && offerToDelete.applicableItems && offerToDelete.applicableItems.length > 0) {
            await updateItemPrices(MenuItem, offerToDelete.applicableItems, offerToDelete.discountPercentage, true);
        }

        await Offer.findByIdAndDelete(id);

        // Broadcast
        const reqIO = req.app.get('io');
        if (reqIO) {
            reqIO.to(req.tenantDbName).emit('offersUpdated');
            reqIO.to(req.tenantDbName).emit('menuUpdated', { action: 'bulkUpdate' });
        }

        res.status(200).json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ message: 'Failed to delete offer' });
    }
};

module.exports = {
    getOffers,
    createOffer,
    updateOffer,
    deleteOffer
};
