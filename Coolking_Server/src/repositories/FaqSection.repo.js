const { FaqSection } = require('../databases/mongodb/schemas/FaqSection');


const getSections = async () => {
    try {
        const docs = await FaqSection.find({}, { section: 1 }).sort({ section: 1 }).lean();

        if (!docs) {
            throw new Error("Failed to get FAQ sections");
        }
        return docs.map(d => d.section);
    } catch (error) {
        console.error("Error retrieving FAQ sections:", error);
        throw error;
    }
}

exports.getSections = getSections;