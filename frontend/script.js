
let alarm = new Audio("alarm.wav")

const socket = io();

//socket.emit("getclasses");

let charts = {};

let data = {

};

let heartRates = {};

let c = 0;

let parallaxAm = 0.02;
let parallaxSp = 0.01;
let relativeX = 0;
let relativeY = 0;
let posX = 0;
let posY = 0;

window.addEventListener('mousemove', (event) => {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  relativeX = event.clientX - centerX;
  relativeY = event.clientY - centerY;
  relativeX *= parallaxAm;
  relativeY *= parallaxAm;

});

setInterval(() => {
  console.log('pos X:', posX, 'pos Y:', posY);
  let img = document.getElementById("backgroundimage");

  posX = posX + (relativeX - posX) * parallaxSp;
  posY = posY + (relativeY - posY) * parallaxSp;

  img.style.transform = `translate(${posX}px, ${posY}px)`;

}, 1000/180)

/*
function getData(){
  c++;

  //console.log(data["Ritik Jalisatgi2"])

  let keys = Object.keys(data);

  for(var i = 0; i < keys.length; i++){

    let t = new Date().getTime() + Math.random() * 500;
    data[keys[i]].heart.push(t);
    data[keys[i]].oxygen.push(Math.random() * 100);

  }

  return data;

}
*/


let pausedList = new Set();

function pausebutton(event){

  let key = event.parentElement.parentElement.parentElement.parentElement.id;

  let paused = event.innerHTML != "Pause";
  if(!paused){
    pausedList.add(key);
    event.innerHTML = "Unpause"
  }
  else{
    pausedList.delete(key);
    event.innerHTML = "Pause"
  }

}


function heartdata(event){
    // Create element with <a> tag
  const link = document.createElement("a");

  let key = event.parentElement.parentElement.parentElement.parentElement.id;

  let heart = charts[key].chartLIB.data.datasets[0].data
  let oxygen = charts[key].chartLIB.data.datasets[1].data

  let content = "";
  content += "Heart Data (BPM): ";

  for(var i = 0; i < heart.length; i++){
    content += heart[i] + "BPM, ";
  }
  content += "\nOxygen (SPO2): ";


  for(var i = 0; i < heart.length; i++){
    content += oxygen[i] +"%, ";
  }

  // Create a blog object with the file content which you want to add to the file
  const file = new Blob([content], { type: 'text/plain' });

  // Add file content in the object URL
  link.href = URL.createObjectURL(file);

  // Add file name
  link.download = `Heart Data - ${key}.txt`;

  // Add click event to <a> tag to save file.
  link.click();
  URL.revokeObjectURL(link.href);
}

function heartanalysis(event){

  let button = event;
  button.disabled = true;
  button.style.opacity = 0.3;
  button.innerHTML = "Analyzing..."

  let key = document.getElementById("analysis").parentElement.parentElement.parentElement.parentElement.id;

  setTimeout(() => {

    let heart = charts[key].chartLIB.data.datasets[0].data
    console.log(data);

    let avg = 0;

    for(var i = 0; i < heart.length; i++){
      avg += heart[i];
    }
    avg /= heart.length;
    let avgdist = 0;
    for(var i = 0; i < heart.length; i++){
      avgdist += Math.abs(avg-heart[i])
    }
    avgdist /= heart.length;
    console.log(avgdist);

    let distScore = 1 / (1 + avgdist / 50);

    let lowTest = 0;

    for(var i = 0; i < heart.length; i++){
      if(heart[i] < cardiac){
        lowTest++;
      }
    }
    lowTest /= heart.length;
    lowTest = 1 - lowTest;

    let score = (distScore + lowTest) / 2;

    let format = Math.floor(score * 1000) / 10 +"%";

    let grades = ["F-", "F", "F+", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];

    let grade = grades[Math.floor(score * (grades.length))]

    button.innerHTML = format +", " + grade;

    button.style.opacity = 1;

    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = "Analyze Heart";
    }, 17000)


  }, 3000)

}

setInterval(() => {
  socket.emit("data");
}, 1000)

socket.on("data", (rates) => {
  data = rates;
})


let cardiac = 20;

function rateThreshold(event){
  cardiac = event.value;
  let keys = Object.keys(charts);

  for(var i = 0; i < keys.length; i++){
    charts[keys[i]].chartLIB.update();
  }
}

const horizontalLinePlugin = {
            id: 'horizontalLine',
            afterDraw: (chart) => {
                const yValue = chart.scales.y.getPixelForValue(cardiac);
                const ctx = chart.ctx;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(chart.chartArea.left, yValue);
                ctx.lineTo(chart.chartArea.right, yValue);
                ctx.strokeStyle = 'purple';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
        };

function createChart(key){

  let newChart = document.getElementById("exampleheartChart").cloneNode(true);

  console.log(data[key]);

  newChart.querySelector(".name").innerHTML = data[key].patient.name;
  newChart.querySelector(".patientName").innerHTML = data[key].patient.name;
  newChart.querySelector(".age").innerHTML = data[key].patient.age;
  newChart.querySelector(".healthrating").innerHTML = data[key].patient.health;
  newChart.querySelector(".personalDesc").innerHTML = data[key].patient.personal;

  newChart.id = key;

  let heartCanvas = document.createElement("canvas");
  heartCanvas.id = key + "chart";

  let heartCtx = heartCanvas.getContext("2d");
  heartCharts.appendChild(heartCanvas)

  newChart.insertBefore(heartCanvas, newChart.children[1]);
  newChart.removeChild(newChart.children[2])

  let chartLIB = new Chart(heartCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Heart Rate for ' + data[key].patient.name + " (BPM)",
        backgroundColor: "rgb(255,0,0)",
        borderColor: "rgb(255,0,0)",
        data: [],
        borderWidth: 1
      },{
        label: 'Blood Oxygen for ' + data[key].patient.name + " (SPO2)",
        backgroundColor: "rgb(0,0,255)",
        borderColor: "rgb(0,0,255)",
        data: [],
        borderWidth: 1
      },{
        label: 'G-Force (ft/s^2)',
        backgroundColor: "rgb(0,255,0)",
        borderColor: "rgb(0,255,0)",
        data: [],
        borderWidth: 1
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          suggestedMin: 0,
          suggestedMax: 200
        },
        x:{
          type: 'time',
          time: {
            unit: 'second'
          },
          ticks:{
            maxTicksLimit: 5
          }
        }
      }
    },
    plugins: [horizontalLinePlugin]
  });

  console.log("INITIALIZED", chartLIB)

  document.getElementById("heartCharts").appendChild(newChart);

  console.log(newChart.style.opacity);

  newChart.children[0].children[0].style.display = "none";
  newChart.children[0].children[1].style.display = "";

  setTimeout(()=>{newChart.style.opacity = 1});

  return {chartLIB: chartLIB, element: newChart}


}

function closeAI(box){

  box.parentElement.style.display = "none";

}

function aiAnalysis(button){
  button.parentElement.parentElement.parentElement.parentElement.querySelector(".aiAnalysisBox").style.display = ""
}

function aisubmit(e){
  if(e.key == "Enter"){

    let content = e.target.value;
    console.log(content);

    let newMessage = document.createElement("p");
    newMessage.classList.add("userMessage");
    let messages = e.target.parentElement.querySelector(".aiMessages");
    let key = e.target.parentElement.parentElement.id;

    let heart = charts[key].chartLIB.data.datasets[0].data
    let oxygen = charts[key].chartLIB.data.datasets[1].data

    let maxheart = 0;
    let minheart = 0;
    let meanheart = 0;

    if(heart.length > 0){
      maxheart = Math.max(...heart);
      minheart = Math.min(...heart);
      meanheart = heart.reduce( (a,b) => a + b) / heart.length;
    }
    if(maxheart == 0){
      maxheart = "Unknown";
      minheart = "Unknown";
      meanheart = "Unknown"
    }

    console.log(maxheart, minheart, meanheart)

    newMessage.innerHTML = content;
    newMessage.style.opacity = 0;
    messages.insertBefore(newMessage, messages.querySelector(".spacerlast"))
    setTimeout(()=>{
      newMessage.style.opacity = 1;
    })
    messages.scrollTo(0, messages.scrollHeight)

    e.target.opacity = 0.1;
    e.target.disabled = true;

    const conversation = [
      {role: 'system',
      content:
`You are an AI assistant that gives health information based on the pilot's heartrate. You are speaking to the viewer of the dashboard.
For example, dietary plans to improve heart rate, whether a heart rate is too low or too high, and other things a medical doctor would say. Make sure to include sources.
Your message is directly set as the innerHTML of an element. Use HTML code to make everything look great.
Also, be sure to bold important information.

${key} Heart Information (During day to day activity):
Average BPM over past hour: ${meanheart} BPM
Lowest BPM over past hour: ${minheart} BPM
Highest BPM over past hour: ${maxheart} BPM`}
    ];

    let children = messages.children;

    for(var i = 1; i < children.length-1; i++){
      if(children[i].classList.contains("aiMessage")){
        conversation.push({role: "assistant", content: children[i].innerHTML})
      }
      else{
        conversation.push({role: "user", content: children[i].innerHTML})
      }
    }

    console.log(conversation);

    setTimeout(() => {
      let aiMessage = document.createElement("p");
      aiMessage.classList.add("aiMessage");
      aiMessage.innerHTML = "<b>...</b>";
      aiMessage.style.opacity = 0;
      messages.insertBefore(aiMessage, messages.querySelector(".spacerlast"))
      setTimeout(()=>{
        aiMessage.style.opacity = 1;
      })
      messages.scrollTo(0, messages.scrollHeight)

      streamChatGPTMessage(conversation, aiMessage).then(() => {

        console.log("THEY FINISHED");
        e.target.disabled = false;
        e.target.opacity = 1;

      })

    }, 500)



    e.target.value = "";

  }

}


async function streamChatGPTMessage(conversation, element) {
    const apiUrl = 'https://api.openai.com/v1/chat/completions'; // OpenAI Chat API
    const apiKey = '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'; // Replace with actual API key

    const requestBody = {
        model: 'gpt-4',
        messages: conversation,
        stream: true // Enable streaming
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    // Create a readable stream to process incoming chunks of data
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';  // Buffer to hold partial chunks

    let first = true;

    return new Promise(async (resolve, reject) => {

      let final = "";
      let buffer = [];

      while (true) {

          if(first){
            element.innerHTML = "";
            first = false;
          }

          const { value, done } = await reader.read();
          if (done) break;

          let res = decoder.decode(value);
          console.log("Response", res);
          res = res.split("[DONE]")[0]
          console.log("Remove [DONE]", res);
          res = res.split("\n\n");
          console.log("Broken Up", res);

          if(buffer.length == 0) buffer.push("");
          buffer[0] += res[0];
          for(var i = 1; i < res.length; i++){
            buffer.push(res[i]);
          }

          console.log("Buffer", buffer);

          while(buffer.length > 0){

            let text = buffer[0];

            text = text.substring(6,text.length)

            if(text.length == 0) break;

            try{
              let words = JSON.parse(text);
              words = words["choices"][0]["delta"]["content"]
              if(words != undefined) final += words;
              buffer.shift();
            }
            catch{
              console.log("Error")
              console.log(text);
              break;
            }

          }

          element.innerHTML = final;
          console.log(final);

          await new Promise(resolve => setTimeout(resolve, 100));
      }

      resolve();

    })


}

function alertChart(chart){
  charts[chart].element.style.background = "rgba(255,0,0,0.2)";
  alarm.play();
}
function deAlertChart(chart){
  charts[chart].element.style.background = "";
}

function activateChart(chart){

  charts[chart].element.children[0].children[1].style.display = "none";
  charts[chart].element.children[0].children[0].style.display = "";
  charts[chart].element.style.opacity = 1;

  deAlertChart(chart);


}

function deActivateChart(chart){

  charts[chart].element.children[0].children[0].style.display = "none";
  charts[chart].element.children[0].children[1].style.display = "";
  //charts[chart].element.style.opacity = 0.6;


}
/*
setInterval(() => {
  data = getData()
}, 1000)
*/
setInterval(() => {

  let keys = Object.keys(data);

//console.log("keys", keys, Object.keys(charts));

  for(var l = 0; l < keys.length; l++){

    if(!(keys[l] in charts)){
      //console.log("ye");
      charts[keys[l]] = createChart(keys[l]);
      console.log("chart created for ", keys[l]);
    }
    else{

      if(pausedList.has(keys[l])){
        deActivateChart(keys[l]);
        continue;
      }

      let chart = charts[keys[l]];
      let chartLIB = chart.chartLIB;

      let labels = chartLIB.data.labels;

      let heart = data[keys[l]].heart
      let oxygen = data[keys[l]].oxygen
      let force = data[keys[l]].force


      if(labels.length > 0){

        while(labels[labels.length-1] - labels[0] > 60000){
          labels.shift();
          chartLIB.data.datasets[0].data.shift();
          chartLIB.data.datasets[1].data.shift();
          chartLIB.data.datasets[2].data.shift();
          chartLIB.update();
        }
      }

      if(labels.length == 0 || labels[labels.length-1] < heart[heart.length-1]){

        let time2 = new Date().getTime()

        if(time2 - data[keys[l]].lastActive > 5000){

          deActivateChart(keys[l])
          continue;

        }

        activateChart(keys[l])

        let i1 = heart.indexOf(labels[labels.length-1]);
        if(i1 == -1 && labels.length != 0){
          i1 = heart.length-2
        }


        for(var i = i1 + 1; i < heart.length; i++){

          labels.push(heart[i]);

          let beats = 0;
          let time = 1;
          let k1 = i;

          while(k1 > 0 && time + heart[k1] - heart[k1-1] < 10000){
            beats++;
            time += heart[k1] - heart[k1-1];
            k1--;
          }

          chartLIB.data.datasets[0].data.push(60000 * beats/time);
          chartLIB.data.datasets[1].data.push(oxygen[i]);
          chartLIB.data.datasets[2].data.push(force[i]);

          //chart.data.labels.push(chart.data.labels.length);
          //chart.data.datasets[0].data.push(chart.data.labels.length);
          //chart.update();

        }

        chartLIB.update();

        while(labels.length > 25){
          labels.shift();
          chartLIB.data.datasets[0].data.shift();
          chartLIB.data.datasets[1].data.shift();
          chartLIB.data.datasets[2].data.shift();
        }

        //console.log(labels, chartLIB.data.datasets[0].data)

        //chartLIB.update();

      }
      else{

        console.log("here", (new Date().getTime() - labels[labels.length-1]));

        let time = new Date().getTime()

        if(time - data[keys[l]].lastActive > 5000){

          deActivateChart(keys[l])

        }
        else{

          activateChart(keys[l])

          if(time - data[keys[l]].lastActive < 5000 && time - heart[heart.length-1] > 9000){
            console.log("HEART NOT BEAT??")
            labels.push(time);
            chartLIB.data.datasets[0].data.push(0);
            chartLIB.data.datasets[1].data.push(oxygen[oxygen.length-1]);
            chartLIB.data.datasets[2].data.push(force[force.length-1]);
            chartLIB.update();
          }


        }


      }

      let zero = 0;

      let heartData = chartLIB.data.datasets[0].data;

      let index = heartData.length-1;
      while(index >= 0 && heartData[index] < cardiac && (new Date().getTime()) - labels[index] < 10000){
        zero++;
        index--;
      }

      if(zero >= 5){
        alertChart(keys[l]);
      }


    }
  }


}, 1000)



/*
socket.on("data", (rates) => {

  let keys = Object.keys(rates);

  heartRates = rates

  for(var i = 0; i < keys.length; i++){

    if(!(keys[i] in charts)){

      let heartCharts = document.getElementById("heartCharts");

      let heartCanvas = document.createElement("canvas");
      heartCanvas.id = keys[i] + "chart";

      let heartCtx = heartCanvas.getContext("2d");
      heartCharts.appendChild(heartCanvas)

      charts[keys[i]] = new Chart(heartCtx, {
        type: 'line',
        data: {
          labels: [0,1,2,3,4,5],
          datasets: [{
            label: 'Heart Rate for ' + keys[i],
            backgroundColor: "rgb(255,0,0)",
            borderColor: "rgb(255,0,0)",
            data: [12, 19, 3, 5, 2, 3],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

    }

  }

})
*/

setInterval(() => {
  //socket.emit("data");
}, 5000);


function init(){
  console.log("hello")

  const ctx = document.getElementById('myChart');

  let chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [0,1,2,3,4,5],
      datasets: [{
        label: 'Heart Rate',
        backgroundColor: "rgb(255,0,0)",
        borderColor: "rgb(255,0,0)",
        data: [12, 19, 3, 5, 2, 3],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

}