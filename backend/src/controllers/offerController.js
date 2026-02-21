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
        const { Offer } = req.tenantModels;
        const newOffer = new Offer(req.body);
        const savedOffer = await newOffer.save();

        // Broadcast via socket if configured
        const reqIO = req.app.get('io');
        if (reqIO) {
            reqIO.to(req.tenantDbName).emit('offersUpdated');
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
        const { Offer } = req.tenantModels;

        const updatedOffer = await Offer.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedOffer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Broadcast
        const reqIO = req.app.get('io');
        if (reqIO) {
            reqIO.to(req.tenantDbName).emit('offersUpdated');
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
        const { Offer } = req.tenantModels;

        const deletedOffer = await Offer.findByIdAndDelete(id);

        if (!deletedOffer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Broadcast
        const reqIO = req.app.get('io');
        if (reqIO) {
            reqIO.to(req.tenantDbName).emit('offersUpdated');
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
