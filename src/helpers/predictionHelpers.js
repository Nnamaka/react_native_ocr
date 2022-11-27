import * as ImageManipulator from 'expo-image-manipulator';
// import MlkitOcr from 'react-native-mlkit-ocr';


export const buildDetectedObjects = (scores, threshold, boxes, classes, classesDir, size) => {
    const detectionObjects = []

    scores[0].forEach((score, i) => {
        if (score > threshold) {
            const bbox = [];
            const minY = boxes[0][i][0] * size.height;
            const minX = boxes[0][i][1] * size.width;
            const maxY = boxes[0][i][2] * size.height;
            const maxX = boxes[0][i][3] * size.width;
            bbox[0] = minX;
            bbox[1] = minY;
            bbox[2] = maxX - minX;
            bbox[3] = maxY - minY;
            detectionObjects.push({
                class: classes[i],
                label: classesDir[classes[i]].name,
                score: score.toFixed(4),
                bbox: bbox
            })
        }
    })

    return detectionObjects
}

export const getDuplicates = (predictions) => {
    var theClasss = [
        { class: 'idnumber', count: 0, indexes: [] }, { class: 'lastnames', count: 0, indexes: [] }, { class: 'firstnames', count: 0, indexes: [] },
        { class: 'id2', count: 0, indexes: [] }, { class: 'id1', count: 0, indexes: [] }, { class: 'sex', count: 0, indexes: [] },
        { class: 'height', count: 0, indexes: [] }, { class: 'dateofbirth', count: 0, indexes: [] }, { class: 'bloodgroup', count: 0, indexes: [] },
        { class: 'placeofbirth', count: 0, indexes: [] }, { class: 'expirelocation', count: 0, indexes: [] },
    ]

    theClasss.filter(function (aClass, aindex) {
        predictions.filter(function (value, bindex) {
            if (aClass.class == value.label) {
                aClass.count = aClass.count + 1;
                aClass.indexes.push(bindex);
            }
        })
    })

    return theClasss;
}


export const filterPredictions = (predictions, duplicates) => {
    let theNewData = [];

    predictions.filter(function (value, index) {
        let highest = 0;
        let containsZero = false;
        let indexx = undefined;
        let exist = false;

        theNewData.filter(function (valuee, idx) {
            if (value.label == valuee.label)
                exist = true;
        })

        if (exist == false) {
            duplicates.filter(function (bvalue, index) {
                if (bvalue.class == value.label) {
                    bvalue.indexes.filter(function (avalue, idx) {
                        predictions[avalue].bbox.filter(function (val, idx) {
                            if (val == 0)
                                containsZero = true;
                        })

                        if (predictions[avalue].score > highest && containsZero == false) {
                            highest = predictions[avalue].score;
                            indexx = avalue;
                        }

                        containsZero = false;

                        if (bvalue.indexes.length == (idx + 1) && indexx != undefined)
                            theNewData.push(predictions[indexx])

                    })
                }
            })
        }
    })
    return theNewData;
}


export const keepFrontOrBack = (theNewData) => {
    let front = ['idnumber', 'lastnames', 'firstnames']
    let back = ['id2', 'id1', 'sex', 'height', 'dateofbirth', 'bloodgroup', 'placeofbirth', 'expirelocation'];
    let side = '';

    front.filter(function (value, idx) {
        if (theNewData[0].label == value)
            side = 'front';
    })

    back.filter(function (value, idx) {
        if (theNewData[0].label == value)
            side = 'back';
    })

    let newData = []

    if (side == 'front') {
        newData = theNewData.filter(function (value) {
            let keep = true;

            back.filter(function (valuee) {
                if (value.label == valuee)
                    keep = false;
            })
            return keep
        })
    }

    if (side == 'back') {
        newData = theNewData.filter(function (value) {
            let keep = true;

            front.filter(function (valuee) {
                if (value.label == valuee)
                    keep = false;
            })
            return keep
        })
    }
    console.log('side of card is ', side);

    return newData
}


export const cropROIs = async (detectionObjects, imageUri) => {
    let regions = []

    for (let i = 0; i < detectionObjects.length; i++) {
        let x = detectionObjects[i].bbox[0];
        let y = detectionObjects[i].bbox[1];
        let widthh = detectionObjects[i].bbox[2];
        let heightt = detectionObjects[i].bbox[3];

        const newImage = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ crop: { height: heightt, originX: x, originY: y, width: widthh, } }],
            { compress: 1, format: 'jpeg' },
        );

        regions.push({
            textRegion: newImage,
            class: detectionObjects[i].label
        })
    }

    return regions;
}

export const detectText = async (selectedRegions) => {
    let text = [];
    let resultFromUri = undefined;

    // for (let i = 0; i < selectedRegions.length; i++) {
    //     try {
    //         resultFromUri = await MlkitOcr.detectFromUri(selectedRegions[i].textRegion.uri);
    //         text.push(resultFromUri);
    //     }
    //     catch {
    //         text.push('bad')
    //     }

    // }

    return text;
}