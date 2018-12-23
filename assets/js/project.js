var active = {};
var blockIP = [
  {'name': 'OCS', 'ip': '158.108.0.0/19'},
  {'name': 'KITS', 'ip': '158.108.32.0/19'},
  {'name': 'LIB', 'ip': '158.108.64.0/19'},
  {'name': 'SCI', 'ip': '158.108.96.0/19'},
  {'name': '50Y', 'ip': '158.108.128.0/19'},
  {'name': 'ENG', 'ip': '158.108.160.0/19'},
  {'name': 'RAPEE', 'ip': '158.108.192.0/19'},
  {'name': 'AIS', 'ip': '158.108.224.0/19'}
];
var colorCode = {
  'OCS': '#c23531',
  'KITS': '#2f4554',
  'LIB': '#61a0a8',
  'SCI': '#d48265',
  '50Y': '#91c7ae',
  'ENG': '#749f83',
  'RAPEE': '#ca8622',
  'AIS': '#bda29a'
}


var x = [];
var datas = {};
var allDatas = [];
var series = [];
var legend = [];
var maxValue = 0;
var split = 8;
var startDate = 1483290948262;
var endDate = 1483328674000;
var init = true;
var client = new $.es.Client({
  hosts: '10.3.132.185:9200'
});
//
// client.ping({
//   requestTimeout: 30000,
// }, function (error) {
//   if (error) {
//     console.error('elasticsearch cluster is down!');
//   } else {
//     console.log('All is well');
//   }
// });
//
//


$(document).ready(function(){

  searchelk();
  $('.file-upload').file_upload();

  $('form #filesubmit').on('click', (e)=>{
        var uploadfile = $("input[name=avatar]")[0].files[0];
        var formData = new FormData();
        formData.append("avatar", uploadfile);
        var localurl = 'http://10.3.132.185:7777/uploadlog';
        // console.log('uploadfile', uploadfile, uploadfile.type);
        $.ajax({
            url: localurl,  // googleCloud
            data: formData,
            processData: false,
            contentType: false,
            type: 'POST',
            xhr: function(){
          		//upload Progress
          		var xhr = $.ajaxSettings.xhr();
          		if (xhr.upload) {
          			xhr.upload.addEventListener('progress', function(event) {
          				var percent = 0;
          				var position = event.loaded || event.position;
          				var total = event.total;
          				// if (event.lengthComputable) {
          					percent = Math.round(position / total * 100);
          				// }
          				//update progressbar
                  // console.log(percent);
                  document.getElementById("progressBar").value = percent;
          				document.getElementById("progressBar").style.display = 'block';
                  document.getElementById("status").innerHTML = percent + "% uploaded... please wait";
          			}, true);
          		}
          		return xhr;
          	},
            success: function(data){
                // console.log('response data', data);
                swal({
                  title: "Upload log success!",
                  text: " ",
                  icon: "success",
                  button: false,
                  timer:1500,
                });
                $("input[name=avatar]").val('');
                document.getElementById("progressBar").value = 0;
                document.getElementById("progressBar").style.display = 'none';
                document.getElementsByClassName("file-upload-text")[0].innerHTML = "Browse for file ...";
                document.getElementById("status").innerHTML = "";
                $('#exampleModal').modal('toggle');
            }
        });
    });

  $('input[name="daterange"]').daterangepicker({
    timePicker: true,
    startDate: moment(parseInt(1483290948262)).format("DD/MM/YYYY hh:mm A"),
    endDate: moment(parseInt(1483328674000)).format("DD/MM/YYYY hh:mm A"),
    locale: {
      format: "DD/MM/YYYY hh:mm A"
    }
  }, function(start, end, label) {
    // console.log("A new date selection was made: " + start.format('x') +',' + moment(start).utc().valueOf() + ' to ' + end.format('DD-MM-YYYY')  + ',' + moment(end).utc().valueOf());
    startDate = moment(start).valueOf();
    endDate = moment(end).valueOf();
  });
})

function genGraph(){
  maxValue = parseInt(document.getElementById("maxValue").value);
  split = parseInt(document.getElementById("splitValue").value);
  var activeNO = $('#myRange').prop('checked');
  // console.log(maxValue,split,activeNO);
  series = [];
  legend = [];
  Object.keys(datas).forEach(function(key) {
    if(activeNO){
      var color = null;
      var bwidth = 0;
    }else{
      // var color = getRandomColor();
      var color = colorCode[key];
      var bwidth = 3;
    }

    series.push(
      {
          name: key,
          type: 'heatmap',
          data: datas[key],
          itemStyle: {
              color: color,
              borderColor: color,
              borderWidth: bwidth,
              emphasis: {
                  shadowBlur: 10,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
          }
      }
    );
    legend.push({
      name: key,
      icon: 'circle',
      textStyle: {
          color: 'white'
      }
    });
  });
  var top = [];
  for(let i of allDatas){
    if(i[2] >= maxValue){
      top.push(i);
    }
  }
  // console.log('top', top);
  series.push(
    {
        name: 'Alerted',
        type: 'effectScatter',
        data: top,
        symbolSize: 20,
        showEffectOn: 'render',
            rippleEffect: {
                brushType: 'stroke'
            },
            hoverAnimation: true,
            itemStyle: {
                normal: {
                    color: '#f4e925',
                    shadowBlur: 10,
                    shadowColor: '#333'
                }
            },
            zlevel: 1
    }
  );
  legend.push({
    name: 'Alerted',
    icon: 'circle',
    textStyle: {
        color: 'white'
    }
  });

  drawActive();
}

function drawActive() {

  // console.log($('#myRange').prop('checked'))
  // console.log(data,x,y,max);
  var dom = document.getElementById("container");
  let existInstance = echarts.getInstanceByDom(dom);
  if (existInstance) {
    if (true) {
      echarts.dispose(existInstance);
    }
  }
  var myChart = echarts.init(dom);
  option = null;

  option = {
      tooltip: {
          position: 'top',
          // formatter: '{c}'
          formatter: function (obj) {
            var value = obj.value;
            // console.log(obj);
            var ip = '158.108.' + value[1] + '.' + value[0];
            var faculty ='';
            for(var j of blockIP){
              if(inSubNet(ip, j.ip)){
                faculty = j.name;
              }
            }
            return '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                + faculty
                + '</div>'
                + '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                + 'IP : 158.108.' + value[1] + '.' + value[0]
                + '</div>'
                + 'count ：' + value[2]
        }
      },
      legend: {
          top: '95%',
          data: legend
      },
      animation: false,
      dataZoom: [{
            type: 'slider',
            xAxisIndex: 0,
            // filterMode: 'weakFilter',
            height: 10,
            bottom: 0,
            start: 0,
            end: 100,
            // handleIcon: 'M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
            handleSize: 0,
            showDetail: false,
            show: false
        }, {
            type: 'inside',
            xAxisIndex: 0,
            filterMode: 'weakFilter',
            start: 0,
            end: 100,
            zoomOnMouseWheel: true,
            moveOnMouseMove: true
        }, {
            type: 'slider',
            yAxisIndex: 0,
            zoomLock: true,
            width: 10,
            right: 10,
            top: 70,
            bottom: 20,
            start: 0,
            end: 100,
            handleSize: 0,
            showDetail: false,
            show: false
        }, {
            type: 'inside',
            yAxisIndex: 0,
            start: 0,
            end: 100,
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: true
        }],
      grid: {
          height: '85%',
          x: '15%',
          y: '2%'
      },
      xAxis: {
          type: 'category',
          data: x,
          axisLine: {
              lineStyle: {
                  color: '#eee'
              }
          }
          // splitArea: {
          //     show: true,
          //     interval: 0
          // }
      },
      yAxis: {
          type: 'category',
          data: x,
          axisLine: {
              lineStyle: {
                  color: '#eee'
              }
          }
          // splitArea: {
          //     show: true,
          //     interval: 0
          // }
      },
      visualMap: {
        seriesIndex: ['0','1','2','3','4','5','6','7'],
        type: 'piecewise',
        min: 0,
        max: maxValue,
        calculable: true,
        realtime: false,
        splitNumber: split,
        // text: ['High', 'Low'],
        textStyle: {
          color: '#eee',
        },
        top: '60%',
        align: 'right',

    },
      series: series
  };;
  if (option && typeof option === "object") {
      myChart.setOption(option, true);
  }
}

function ip2long(ip){
    var components;

    if(components = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/))
    {
        var iplong = 0;
        var power  = 1;
        for(var i=4; i>=1; i-=1)
        {
            iplong += power * parseInt(components[i]);
            power  *= 256;
        }
        return iplong;
    }
    else return -1;
};

function inSubNet(ip, subnet)
{
    var mask, base_ip, long_ip = ip2long(ip);
    if( (mask = subnet.match(/^(.*?)\/(\d{1,2})$/)) && ((base_ip=ip2long(mask[1])) >= 0) )
    {
        var freedom = Math.pow(2, 32 - parseInt(mask[2]));
        return (long_ip > base_ip) && (long_ip < base_ip + freedom - 1);
    }
    else return false;
};
// ['#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae', '#749f83', '#ca8622', '#bda29a'];
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function upload() {
  swal({
    title: "Upload log success!",
    text: " ",
    icon: "success",
    button: false,
    timer:2500,
  });
}

function searchelk(){
  document.getElementById("loading").style.display = 'block';
  $.get(
      "http://10.3.132.185:7777/range="+ startDate + '-'+endDate,
      function(resp) {
        // console.log('res',resp);
        x = [];
          // var hits = resp.hits.hits;
          for(var i=0;i<256;i++){
            active[i] = {};
            for(var j=0;j<256;j++){
              active[i][j] = 0;
            }
          }
          if(resp.hits.total > 0){
            for(let i of resp.hits.hits){
              var ipv4 = i._source.ipv4.split('.');
              if(ipv4[0] == '158' && ipv4[1] == '108'){
                active[ipv4[2]][ipv4[3]]++;
              }
            }
          }


        for(var i=0;i<256;i++){
          x.push(i+'');
          for(var j=0;j<256;j++){
            for(var k of blockIP){
              if(inSubNet('158.108.'+i+'.'+j, k.ip)){
                faculty = k.name;
                if(active[i][j]>0){
                  allDatas.push([j,i,active[i][j]]);
                  if(datas[k.name] == null){
                    datas[k.name] = [[j,i,active[i][j]]];
                  }else{
                    datas[k.name].push([j,i,active[i][j]]);
                  }
                }else{
                  // data.push([j,i,'-']);
                  if(datas[k.name] == null){
                    datas[k.name] = [[j,i,'-']];
                  }else{
                    datas[k.name].push([j,i,'-']);
                  }

                }

              }
            }


            if(active[i][j]>maxValue){
              maxValue = active[i][j];
            }
          }
        }
        if(init){
          document.getElementById("maxValue").value = maxValue;
          init = false;
        }

        genGraph();
        document.getElementById("loading").style.display = 'none';

      }
  );
}


function progressHandler(event) {
  _("loaded_n_total").innerHTML = "Uploaded " + event.loaded + " bytes of " + event.total;
  var percent = (event.loaded / event.total) * 100;
  _("progressBar").value = Math.round(percent);
  _("status").innerHTML = Math.round(percent) + "% uploaded... please wait";
}

function completeHandler(event) {
  _("status").innerHTML = event.target.responseText;
  _("progressBar").value = 0; //wil clear progress bar after successful upload
}

function errorHandler(event) {
  _("status").innerHTML = "Upload Failed";
}

function abortHandler(event) {
  _("status").innerHTML = "Upload Aborted";
}
