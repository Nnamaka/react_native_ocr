import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import * as tf from '@tensorflow/tfjs';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { filterPredictions, getDuplicates, buildDetectedObjects, cropROIs, keepFrontOrBack, detectText } from './predictionHelpers'

const THRESHOLD = 0.02


let classDict = {
  1: { 'name': 'placeofbirth', 'id': 1 }, 2: { 'name': 'dateofbirth', 'id': 2 },
  3: { 'name': 'height', 'id': 3 }, 4: { 'name': 'bloodgroup', 'id': 4 },
  5: { 'name': 'sex', 'id': 5 }, 6: { 'name': 'expirelocation', 'id': 6 },
  7: { 'name': 'id1', 'id': 7 }, 8: { 'name': 'id2', 'id': 8 },
  9: { 'name': 'idnumber', 'id': 9 }, 10: { 'name': 'lastnames', 'id': 10 },
  11: { 'name': 'firstnames', 'id': 11 }
}

export const resizeImage = async (uri, width, height) => {
  const reduce = 0.5;

  const newImage = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: width * reduce, height: height * reduce } }],
    { compress: 0.9, format: 'jpeg' },
  );

  return newImage;
}

export const cropImage = async (uri, width, height) => {

  const newImage = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: { height: 1400, originX: 0, originY: 1370, width: 2300, } }],
    { compress: 1, format: 'jpeg' },
  );

  return newImage;

}

export const imageToTensor = async (uri, width, height) => {

  console.log('converting image to tensor');

  const img64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64, })
  const imgBuffer = tf.util.encodeString(img64, 'base64').buffer;
  const raw = new Uint8Array(imgBuffer);

  let imgtens = decodeJpeg(raw).expandDims();

  return imgtens;
}

export const makePredictions = async (model, imagesTensor) => {
  console.log('infering model...');
  const predictionsData = await model.executeAsync(imagesTensor);
  imagesTensor.dispose();

  return predictionsData;
}


export const showResult = async (imageUri, width, height, model, setImageUri) => {


  console.log('making inference');

  let size = {
    height: height,
    width: width,
  }

  const tensorImage = await imageToTensor(imageUri, width, height);
  const predictions = await makePredictions(model, tensorImage);

  console.log('Gotten final results');

  const boxes = await predictions[6].arraySync();
  const scores = await predictions[4].arraySync();
  const classes = await predictions[1].dataSync();

  console.log(classes);
  console.log(scores);
  // tf.print(predictions)


  // let detectionObjects = buildDetectedObjects(scores, THRESHOLD, boxes, classes, classDict, size);


  // console.log(detectionObjects);

  // let duplicates = getDuplicates(detectionObjects);
  // let fildteredPredictions = filterPredictions(detectionObjects, duplicates);
  // let processedPredictions = keepFrontOrBack(fildteredPredictions);

  // console.log(processedPredictions);

  // let regionBox = await cropROIs(processedPredictions, imageUri);
  // console.log(regionBox);

  // let detectedTexts = await detectText(regionBox);


  // console.log(detectedTexts);
  let text = ``;

  // if (detectedTexts[0] == 'bad')
  //   text = text + 'Bad Capture.\n Position ID properly';
  // else {
  //   processedPredictions.filter(function (value, idx) {
  //     if (detectedTexts[idx].length)
  //       text = text + '\n' + value.label + ':  ' + detectedTexts[idx][0].text + '\n';
  //   })
  // }


  return text;
}


