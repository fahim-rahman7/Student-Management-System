const Subject = require("../models/Subject");

const createSubject = async (req, res) => {
    const {name, code, credits, description} = req.body;
    try {
        if (!name || !code || !credits) {
            return res.status(400).json({
              success: false,
              message: "Name, code, credits are required.",
            });
          }
        
        const newSubject = await Subject.create({
            creatorId: req.user._id,
            name,
            code,
            credits,
            description
        })

        res.status(201).json({
            success: true,
            message: "Subject created successfully.",
            data: newSubject
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Subject Create failed.",
            error: error.message,
          });
    }
}

const getSubject = async (req, res) => {
    try {
        const allSubject = await Subject.find();
        res.status(200).json({
            success: true,
            message: "All Subject Get successfully.",
            data: allSubject
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Subject Create failed.",
            error: error.message,
          });
    }
}
const deleteSubject = async (req, res) => {
    const {id} = req.params;
    console.log(id);
    try {
         await Subject.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Subject Deleted successfully.",
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Subject Delete failed.",
            error: error.message,
          });
    }
}

module.exports = {createSubject, getSubject, deleteSubject} 