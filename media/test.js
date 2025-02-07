let input = '{"name":"John", "age":null, "Address":{"city":"",zipcode:"123456"}}';

process.stdin.on('data', function(chunk) {
    input += chunk;
});

process.stdin.on('end', function() {
    try {
        let obj = JSON.parse(input);

        obj = cleanObject(obj);

        obj = sortObject(obj);

        let output = JSON.stringify(obj);

        console.log(output);
    } catch (err) {
        console.error('Invalid JSON input');
    }
});

function cleanObject(obj) {
    if (obj && typeof obj === 'object') {
        if (Array.isArray(obj)) {
            // Process each element in the array
            for (let i = 0; i < obj.length; i++) {
                if (obj[i] && typeof obj[i] === 'object') {
                    obj[i] = cleanObject(obj[i]);
                }
            }
        } else {
            // Process each property in the object
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (obj[key] === null || obj[key] === '') {
                        delete obj[key];
                    } else if (typeof obj[key] === 'object') {
                        obj[key] = cleanObject(obj[key]);
                    }
                }
            }
        }
    }
    return obj;
}

function sortObject(obj) {
    if (Array.isArray(obj)) {
        return obj.map(sortObject);
    } else if (obj && typeof obj === 'object') {
        let sortedKeys = Object.keys(obj).sort();
        let newObj = {};
        for (let key of sortedKeys) {
            newObj[key] = sortObject(obj[key]);
        }
        return newObj;
    } else {
        return obj;
    }
}
