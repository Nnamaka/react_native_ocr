import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, Alert, Modal, Pressable } from 'react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { Camera, CameraType } from 'expo-camera';
import BarcodeMask from 'react-native-barcode-mask';
import Button from './src/components/Button';
import * as tf from '@tensorflow/tfjs';
import { showResult, resizeImage, cropImage } from './src/helpers/TensorHelpers'

export default function App() {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [imageUri, setImageUri] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [theRoiModel, setRoiModel] = useState(null);
  const [imgHeight, setHeight] = useState(null);
  const [imgWidth, setWidth] = useState(null);
  const [results, setResults] = useState(null);
  const [pred, setPred] = useState(null);

  let cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();

      setHasCameraPermission(cameraStatus.status === 'granted')

      await tf.ready();

      console.log(tf.getBackend());
      console.log(tf.ENV.features);

      const modelJson = require("./assets/tfjsexport/model.json");

      const modelWeights = [
        require("./assets/tfjsexport/group1-shard1of3.bin"),
        require("./assets/tfjsexport/group1-shard2of3.bin"),
        require("./assets/tfjsexport/group1-shard3of3.bin"),
      ];


      const roiModel = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights)).catch((e) => {
        console.log("[LOADING ERROR] info:", e)
      })
      
      // warm model up
      //const warmupResult = await roiModel.executeAsync(tf.zeros([1,224,224,3],  tf.int32).toInt());
      //console.log(warmupResult)

      setRoiModel(roiModel);

      console.log("Models loaded successfully");
    })();
  }, [])

  const takePicture = async () => {
    if (cameraRef) {
      try {
        let data = await cameraRef.current.takePictureAsync();
        console.log(data)

        // let image = await resizeImage(data.uri, data.width, data.height);
        let image = await cropImage(data.uri, data.width, data.height);

        setHeight(image.height);
        setWidth(image.width);
        setImageUri(image.uri);

        console.log(image)
      } catch (e) {
        console.log(e);
      }
    }
  }

  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>
  }

  return (
    <View style={styles.container}>
      {
        !imageUri ? <Camera
          ratio="16:9"
          style={styles.camera}
          type={type}
          //flashMode={flash}
          ref={cameraRef}
        >
          <BarcodeMask edgeColor={'#62B1F6'} width={350} showAnimatedLine={false} outerMaskOpacity={0.5}/>

        </Camera> :
          <Image source={{ uri: imageUri }}
            style={styles.imageComponent}
          // resizeMode='contain'
          />
      }

      <View>
        {
          imageUri ? <View style={styles.afterpicture}>
            <Button title={'Re-take'} icon='retweet' onPress={() => setImageUri(null)} />
            <Button title={'show results'} icon='check' onPress={async () => {
              let values = await showResult(imageUri, imgWidth, imgHeight, theRoiModel, setImageUri)
              setResults(values);
              setModalVisible(true);

            }} />
          </View> : <Button title={'Take a picture'} icon='camera' onPress={takePicture} />
        }
        <View style={styles.centeredView}>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              Alert.alert("Modal has been closed.");
              setModalVisible(!modalVisible);
            }}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>{results}</Text>
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setModalVisible(!modalVisible)}
                >
                  <Text style={styles.textStyle}>Ok</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingBottom: 20
  },
  camera: {
    flex: 1,
    borderRadius: 20,
  },
  afterpicture: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 50,
  },
  imageComponent: {
    aspectRatio: 3 / 2,
    resizeMode: "contain"
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "left",
    fontWeight: 'bold',
    fontSize: 18
  }
});


