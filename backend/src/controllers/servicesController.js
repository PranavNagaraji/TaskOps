const oracledb=require('oracledb');
const {config}=require("../config/db.js")
const Services=require('../models/servicesModel');

async function getServices(req, res){
    let connection;
    try{
        connection=await oracledb.getConnection(config);
        const data=await Services.getAllServices(connection);
        res.status(200).json(data);
    }catch(err){
        res.status(500).json({error: err.message});
    }finally{
        if(connection)
            await connection.close();
    }
}

async function getServiceByid(req, res){
    let connection;
    try{
        connection=await oracledb.getConnection(config);
        const {id}=req.params;
        const data=await Services.getServiceById(connection, id);
        res.status(200).json(data);
    }catch(err){
        res.status(500).json({error: err.message});
    }finally{
        if(connection)
            await connection.close();
    }
}

async function addService(req, res){
    let connection;
    try{
        connection=await oracledb.getConnection(config);
        await Services.addService(connection, req.body);
        res.status(201).json({message:"Service added Successfully"});
    }catch(err){
        res.status(500).json({error:err.message});
    }finally{
        if(connection)
            await connection.close();
    }
}

async function deleteService(req, res){
    let connection
    try{
        connection=await oracledb.getConnection(config);
        const {id}=req.params;
        await Services.deleteService(connection, id);
        res.status(200).json({message:"Service deleted Successfully"});
    }catch(err){
        res.status(500).json({error:err.message});
    }finally{
        if(connection)
            await connection.close();
    }
}

async function updateService(req, res){
    let connection;
    try{
        connection=await oracledb.getConnection(config);
        const {id}=req.params;
        const serviceData=req.body;
        await Services.updateService(connection, id, serviceData);
        res.status(200).json({message:"Service updated Successfully"});
    }catch(err){
        res.status(500).json({error:err.message});
    }finally{
        if(connection)
            await connection.close();
    } 
}

module.exports={getServices, addService, deleteService, updateService, getServiceByid};