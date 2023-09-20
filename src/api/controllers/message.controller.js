const { resolveInclude } = require("ejs");
const { del } = require("express/lib/application");
const sql = require('mssql');
const config = require('../../config/config');

exports.FilterPhones = async (req, res) => {
    const pool = new sql.ConnectionPool(config.sqlConfig);

    try {
        await pool.connect();
        console.log("Successful connection");

        const userIdResult = await pool.request().query(`SELECT userId FROM users WHERE username = '${req.body.username}'`);

        if (userIdResult.recordset.length > 0) {
            const userId = userIdResult.recordset[0].userId;
            const result = await pool.request().query(`SELECT phoneNumber FROM sentPhones WHERE userId = ${userId}`);
            const phoneNumbersAlreadySent = [];
            for (const row of result.recordset) {
                phoneNumbersAlreadySent.push(row.phoneNumber);
            }
            
            let phoneNumbersStr = req.body.id.replace(/\+/g, '').replace(/\ /g, '').replace(/[\s\-()]/g, '');
            let prohibitedNumbersStr = req.body.prohibitedNumbers.replace(/\+/g, '').replace(/\ /g, '').replace(/[\s\-()]/g, '');

            const listProhibited = uniqueList(stringToList(prohibitedNumbersStr))

            const listNumbers = uniqueList(stringToList(phoneNumbersStr,phoneNumbersAlreadySent))

            let finalList  = removeFromList(listNumbers,phoneNumbersAlreadySent)
            finalList  = removeFromList(listNumbers,listProhibited)

            return res.status(201).json({ error: false, data: finalList });
        } else {
            console.log('User not found');
            return res.status(404).json({ error: true, message: 'User not found' });
        }
    } catch (err) {
        // Handle connection or query errors
        console.error('Error:', err);
        return res.status(500).json({ error: true, message: 'Internal server error' });
    } finally {
        // Make sure to release the connection pool
        pool.close();
    }
};

function removeFromList(originalList,removeValues){
    return filteredFromRemovelList = originalList.filter(number => !removeValues.includes(number));
}

function uniqueList(list){
    return [...new Set(list)];
}

function stringToList(inputStr, exclusionList) {
    const phoneNumbersArray = inputStr.split(','); 
    const cleanedNumbers = phoneNumbersArray
        .map(phoneNumber => phoneNumber.replace(/\D/g, '').trim()) 
        .filter(cleanedPhoneNumber => {
            return cleanedPhoneNumber.length > 6 && !exclusionList.includes(cleanedPhoneNumber);
        });

    return cleanedNumbers;
}

function stringToList(inputStr) {
    const phoneNumbersArray = inputStr.split(','); 
    const cleanedNumbers = phoneNumbersArray
        .map(phoneNumber => phoneNumber.replace(/\D/g, '').trim()) 
        .filter(cleanedPhoneNumber => {
            return cleanedPhoneNumber.length > 6;
        });

    return cleanedNumbers;
}

exports.Text = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendTextMessage(
        req.body.id,
        req.body.message
    )
    return res.status(201).json({ error: false, data: data })
}

exports.TextList = async (req, res) => {
    const ids = req.body.ids; 
    const message = req.body.message;

    const stringIds = ids.map(id => id.toString());

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: true, message: 'Invalid or empty list of IDs' });
    }

    const data = await Promise.all(stringIds.map(async (id) => {
        return WhatsAppInstances[req.query.key].sendTextMessage(
            id, message
        )
    }));

    return res.status(201).json({ error: false, data: data });
}

exports.TextListWait = async (req, res) => {
    const ids = req.body.ids;

    console.log(ids)

    const stringIds = ids.map(id => id.toString());
    const message = req.body.message;
    const minTime = req.body.minTime;
    const maxTime = req.body.maxTime;

    // for(let i=0;i<stringIds.length;i++){
    // }
    // console.log(stringIds)

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: true, message: 'Invalid or empty list of IDs' });
    }

    const data = [];

    for (const id of stringIds) {
        const delay = Math.floor(Math.random() * (maxTime * 1000 - minTime * 1000 + 1) + minTime * 1000);
        console.log(`Delay for id ${id}: ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Message sent to id ${id}`);
        // const result = await WhatsAppInstances[req.query.key].sendTextMessage(id, message);
        data.push("result");
    }

    return res.status(201).json({ error: false, data: data });
};

exports.Image = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMediaFile(
        req.body.id,
        req.file,
        'image',
        req.body?.caption
    )
    return res.status(201).json({ error: false, data: data })
}

exports.ImageWait = async (req, res) => {
    const ids = req.body.id;
    const stringIds = ids.split(',').map(id => id.trim());
    const minTime = req.body.minTime;
    const maxTime = req.body.maxTime;
    
    if (!Array.isArray(stringIds) || stringIds.length === 0) {
        return res.status(400).json({ error: true, message: 'Invalid or empty list of IDs' });
    }

    let data;

    for(let i = 0; i< stringIds.length;i++){
        const delay = Math.floor(Math.random() * (maxTime * 1000 - minTime * 1000 + 1) + minTime * 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
            data = await WhatsAppInstances[req.query.key].sendMediaFile(
            stringIds.at(i),
            req.file,
            'image',
            req.body?.caption
        )
    }
 
    return res.status(201).json({ error: false, data: data })
}


exports.Video = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMediaFile(
        req.body.id,
        req.file,
        'video',
        req.body?.caption
    )
    return res.status(201).json({ error: false, data: data })
}

exports.Audio = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMediaFile(
        req.body.id,
        req.file,
        'audio'
    )
    return res.status(201).json({ error: false, data: data })
}

exports.Document = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMediaFile(
        req.body.id,
        req.file,
        'document',
        '',
        req.body.filename
    )
    return res.status(201).json({ error: false, data: data })
}

exports.Mediaurl = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendUrlMediaFile(
        req.body.id,
        req.body.url,
        req.body.type, // Types are [image, video, audio, document]
        req.body.mimetype, // mimeType of mediaFile / Check Common mimetypes in `https://mzl.la/3si3and`
        req.body.caption
    )
    return res.status(201).json({ error: false, data: data })
}

exports.Button = async (req, res) => {
    // console.log(res.body)
    const data = await WhatsAppInstances[req.query.key].sendButtonMessage(
        req.body.id,
        req.body.btndata
    )
    return res.status(201).json({ error: false, data: data })
}

exports.Contact = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendContactMessage(
        req.body.id,
        req.body.vcard
    )
    return res.status(201).json({ error: false, data: data })
}

exports.List = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendListMessage(
        req.body.id,
        req.body.msgdata
    )
    return res.status(201).json({ error: false, data: data })
}

exports.MediaButton = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMediaButtonMessage(
        req.body.id,
        req.body.btndata
    )
    return res.status(201).json({ error: false, data: data })
}

exports.SetStatus = async (req, res) => {
    const presenceList = [
        'unavailable',
        'available',
        'composing',
        'recording',
        'paused',
    ]
    if (presenceList.indexOf(req.body.status) === -1) {
        return res.status(400).json({
            error: true,
            message:
                'status parameter must be one of ' + presenceList.join(', '),
        })
    }

    const data = await WhatsAppInstances[req.query.key]?.setStatus(
        req.body.status,
        req.body.id
    )
    return res.status(201).json({ error: false, data: data })
}

exports.Read = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].readMessage(req.body.msg)
    return res.status(201).json({ error: false, data: data })
}

exports.React = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].reactMessage(req.body.id, req.body.key, req.body.emoji)
    return res.status(201).json({ error: false, data: data })
}
