import { View, Text, Image, StyleSheet } from "react-native";
import { useState, useEffect } from 'react';
import logo from '../assets/logo_white.png';
import { palette } from '../assets/Colors.js';

let recipeArr = new Array;
var deepApiKey = 'ec0761f3-34ec-4785-aa18-e8ae8df71377';

function compare(a, b) {
  const distA = a.res.output.distance;
  const distB = b.res.output.distance;
  let comparison = 0;
  if (distA > distB) {
      comparison = 1;
  } else if (distA < distB) {
      comparison = -1;
  }
  return comparison;
}

function fetchDistances(data, targetUrl) {
    let tempUrls = data.map(x => x.image);
    let arr = new Array;
    let fetches = [];
    for (var i = 0; i < tempUrls.length; i++) {
  
      let recipe = data[i];
  
      const raw = {
        'image1': targetUrl,
        'image2': tempUrls[i]
      };
  
      let urlParameters = Object.entries(raw).map(e => e.join('=')).join('&');
  
      const requestOptions = {
        method: 'POST',
        headers: {
          'User-Agent': 'python-requests/2.26.0',
          'Accept-Encoding': 'gzip, deflate',
          'Accept': '*/*',
          'Connection': 'keep-alive',
          'api-key': deepApiKey,
          'Content-Length': '245',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        // body: "image1=https%3A%2F%2Fwww.foodiecrush.com%2Fwp-content%2Fuploads%2F2020%2F05%2FPenne-Marinara-Sauce-foodiecrush.com-004.jpg&image2=https%3A%2F%2Fwww.foodiecrush.com%2Fwp-content%2Fuploads%2F2020%2F05%2FPenne-Marinara-Sauce-foodiecrush.com-004.jpg"
        body: urlParameters
      };
  
      fetches.push(
        fetch("https://api.deepai.org/api/image-similarity", requestOptions)
          .then(res => res.json())
          .then(res => {
            arr.push({ res, recipe });
          })
          .catch (error => console.log(error))
      );
    }
    Promise.all(fetches).then(function() {
      recipeArr = arr;
    })
};

function getRecipe(url) {
    const raw = JSON.stringify({
      "user_app_id": {
            "user_id": "mpaul97",
            "app_id": "19810bedef094ba093c4e41b57776ed1"
        },
      "inputs": [
        {
          "data": {
            "image": {
              "url": url
            }
          }
        }
      ]
    });
  
    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Key b2456b5779b340c6a6aed1ab51424c30'
      },
      body: raw
    };
  
    var ingredients = [];
  
    fetch("https://api.clarifai.com/v2/models/bd367be194cf45149e75f01d59f77ba7/outputs", requestOptions)
      .then(response => response.text())
      .then(result => {
        var obj = JSON.parse(result, null, 2).outputs[0].data;
        var obj2 = obj.concepts;
        //get clarfai ingredients
        for (var i = 0; i < obj2.length; i++) {
          if (i < 10) {
            ingredients[i] = obj2[i].name;
          }
        }
        var strIngredients = ingredients.toString();
        var spoonKey = 'd39928a7b31048459f53673e3e5b3c91';
        //pass ingredients as string to spoonacular, findByIngredients
        var numberOfRecipes = 5;
        fetch("https://api.spoonacular.com/recipes/findByIngredients?apiKey=" + spoonKey + "&ingredients=" + strIngredients + "&ranking=2&number=" + numberOfRecipes)
          .then(response1 => response1.json())
          .then((data) => {
            fetchDistances(data, url);
          })
          .catch(error => console.log('spoonacular error', error));
        })
        .catch(error => console.log('clarfai error', error));
}

export default function Loading() {

    const [tempTitle, setTempTitle] = useState();

    const checkRecipe = () => {
      if (recipeArr.length === 0) {
        setTimeout(checkRecipe, 500);
      } else {
        try {
          recipeArr.sort(compare);
        } catch (error) {
          console.log('images similarity api error');
        }
        setTempTitle(recipeArr[0].recipe.title);
        alert(tempTitle);
      }
    }

    const a = "https://upload.wikimedia.org/wikipedia/commons/f/fb/Hotdog_-_Evan_Swigart.jpg";

    useEffect(() => {
        getRecipe(a);
        checkRecipe();
    });

    return (
        <View style={styles.container}>
            <Image style={styles.logo} source={logo} alt={"Logo"}/>
            <Text style={styles.analyzingText}>Analyzing...</Text>
            <Text>{tempTitle}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexGrow: 1,
        height: '100%',
        backgroundColor: palette.pink,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -100
    },
    analyzingText: {
        fontSize: 45,
        color: palette.white
    },
    logo: {
        marginTop: 40,
        width: 250,
        height: 250
    },
})