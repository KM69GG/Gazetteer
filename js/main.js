let currencyCode;
let border;
let groupMarkers;

//add commas
function commas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// preloader
$(document).ready(function ($) {
  var Body = $("body");
  Body.addClass("preloader-site");
});
$(window).on("load", function () {
  $(".preloader-wrapper").delay(2000).fadeOut(1000);
  $("body").removeClass("preloader-site");
});

// leaflet
var map = L.map("map").fitWorld();
map.locate({ setView: true, maxZoom: 7 });
var Esri_NatGeoWorldMap = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC",
    maxZoom: 12,
  }
).addTo(map);

function clearMap() {
  if (groupMarkers) {
    groupMarkers.clearLayers();
  }
  if (border) {
    border.clearLayers();
  }
}
// select
$(document).ready(function () {
  $.ajax({
    url: "php/select.php",
    type: "POST",
    dataType: "json",
    success: function (result) {
      console.log("select", result);
      if (result.status.name == "ok") {
        for (var i = 0; i < result.data.border.features.length; i++) {
          $("#selCountry").append(
            $("<option>", {
              value: result.data.border.features[i].properties.iso_a2,
              text: result.data.border.features[i].properties.name,
            })
          );
        }
      }
      $("#selCountry").html(
        $("#selCountry option").sort(function (a, b) {
          return a.text == b.text ? 0 : a.text < b.text ? -1 : 1;
        })
      );
    },
  });

  // user location
  const successCallback = (position) => {
    $.ajax({
      url: "php/openCage.php",
      type: "GET",
      dataType: "json",
      data: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },

      success: function (result) {
        console.log("user location", result);
        currentLat = result.data[0].geometry.lat;
        currentLng = result.data[0].geometry.lng;
        currentCountry = result.data[0].components["ISO_3166-1_alpha-2"];
        $("#selCountry").val(currentCountry).change();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR, textStatus, errorThrown);
      },
    });
  };

  const errorCallback = (error) => {
    console.error(error);
  };
  navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
});

// on change, border, api modals and markers
$("#selCountry").change(function () {
  clearMap();

  $.ajax({
    type: "GET",
    url: "php/border.php",
    dataType: "json",
    data: { iso: $("#selCountry").val() },
    success: function (results) {
      console.log("borders", results);

      border = L.geoJSON(results["data"], {
        color: "#000000",
        weight: 1,
        opacity: 1,
      }).addTo(map);

      map.fitBounds(border.getBounds());
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR, textStatus, errorThrown);
    },
  });

  $.ajax({
    url: "php/restCountries.php",
    type: "GET",
    dataType: "json",
    data: { country: $("#selCountry").val() },
    success: function (results) {
      let data = results["data"][0];
      console.log("info", results);
      let flag = data["flags"]["png"];
      let lang = data["languages"];
      let languages = [];
      currencyCode = Object.keys(data["currencies"])[0];
      let capital = data["capital"];
      $(".flag").attr("src", flag);
      $(".capital").html(capital);
      $("#continent").html(data["region"]);
      $("#capital").html(capital);
      $("#area").html(commas(data["area"] + " km<sup>2</sup>"));
      $("#population").html(commas(data["population"]));
      const multi = Object.getOwnPropertyNames(lang);
      for (let i = 0; i < multi.length; i++) {
        languages += `${
          data["languages"][Object.keys(data["languages"])[i]]
        } <br>`;
        $("#languages").html(languages);
      }
      $("#currency").html(
        data["currencies"][Object.keys(data["currencies"])[0]]["name"]
      );
      $("#symbol").html(
        data["currencies"][Object.keys(data["currencies"])[0]]["symbol"]
      );
      $("#code").html(currencyCode);

      $.ajax({
        url: "php/weather.php",
        type: "POST",
        dataType: "json",
        data: {
          location: data.capital[0],
        },
        success: function (result) {
          var resultCode = result.status.code;
          console.log("weather", result);
          if (resultCode == 200) {
            var d = result.data;
            $("#weatherModalLabel").html(
              "Weather for capital" + " " + d.location
            );
            $("#todayConditions").html(d.forecast[0].conditionText);
            $("#todayIcon").attr("src", d.forecast[0].conditionIcon);
            $("#todayMaxTemp").html(d.forecast[0].maxC);
            $("#todayMinTemp").html(d.forecast[0].minC);
            $("#day1Date").text(
              Date.parse(d.forecast[1].date).toString("ddd dS")
            );
            $("#day1Icon").attr("src", d.forecast[1].conditionIcon);
            $("#day1MinTemp").text(d.forecast[1].minC);
            $("#day1MaxTemp").text(d.forecast[1].maxC);
            $("#day2Date").text(
              Date.parse(d.forecast[2].date).toString("ddd dS")
            );
            $("#day2Icon").attr("src", d.forecast[2].conditionIcon);
            $("#day2MinTemp").text(d.forecast[2].minC);
            $("#day2MaxTemp").text(d.forecast[2].maxC);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.log("weather", textStatus, errorThrown);
        },
      });
    },
  });

  $.ajax({
    url: "php/currency.php",
    type: "GET",
    dataType: "json",
    data: { country: $("#selCountry").val() },
    success: function (result) {
      console.log("exchange rates", result);
      exchangeRate = result.exchangeRate.rates[currencyCode];
      $("#rate").html(
        exchangeRate.toFixed(2) + " " + currencyCode + " to 1 USD"
      );
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR, textStatus, errorThrown);
    },
  });

  $.ajax({
    url: "php/covid.php",
    type: "GET",
    dataType: "json",
    data: {
      country: $("#selCountry").val(),
    },
    success: function (result) {
      let data = result.data;
      console.log("covid", result);
      $("#totalCases").html(commas(data.cases));
      $("#totalDeaths").html(commas(data.deaths));
      $("#totalR").html(commas(data.recovered));
      $("#todayCases").html(commas(data.todayCases));
      $("#todayDeaths").html(commas(data.todayDeaths));
      $("#todayR").html(commas(data.todayRecovered));
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log("covid", textStatus, errorThrown);
    },
  });

  $.ajax({
    url: "php/news.php",
    type: "GET",
    dataType: "JSON",
    data: { country: $("#selCountry").val() },
    success: function (results) {
      let data = results.data;
      console.log("news", results);
      $("#newsImg1").attr("src", data.articles[0].image);
      $("#newsTitle1").html(data.articles[0].description);
      $("#newsHref1").attr("href", data.articles[0].url);
      $("#newsImg2").attr("src", data.articles[1].image);
      $("#newsTitle2").html(data.articles[1].description);
      $("#newsHref2").attr("href", data.articles[1].url);
      $("#newsImg3").attr("src", data.articles[2].image);
      $("#newsTitle3").html(data.articles[2].description);
      $("#newsHref3").attr("href", data.articles[2].url);
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR, textStatus, errorThrown);
    },
  });

  $.ajax({
    url: "php/holiday.php",
    type: "GET",
    dataType: "JSON",
    data: { country: $("#selCountry").val() },
    success: function (results) {
      let data = results.data;
      console.log("holiday", results);
      $("#name").html(data.holidays[0].name);
      $("#date").html(
        Date.parse(data.holidays[0].date).toString("dS MMMM yyyy")
      );
      $("#name1").html(data.holidays[1].name);
      $("#date1").html(
        Date.parse(data.holidays[1].date).toString("dS MMMM yyyy")
      );
      $("#name2").html(data.holidays[2].name);
      $("#date2").html(
        Date.parse(data.holidays[2].date).toString("dS MMMM yyyy")
      );
      $("#name3").html(data.holidays[3].name);
      $("#date3").html(
        Date.parse(data.holidays[3].date).toString("dS MMMM yyyy")
      );
      $("#name4").html(data.holidays[4].name);
      $("#date4").html(
        Date.parse(data.holidays[4].date).toString("dS MMMM yyyy")
      );
      $("#name5").html(data.holidays[5].name);
      $("#date5").html(
        Date.parse(data.holidays[5].date).toString("dS MMMM yyyy")
      );
      $("#name6").html(data.holidays[6].name);
      $("#date6").html(
        Date.parse(data.holidays[6].date).toString("dS MMMM yyyy")
      );
      $("#name7").html(data.holidays[7].name);
      $("#date7").html(
        Date.parse(data.holidays[7].date).toString("dS MMMM yyyy")
      );
      $("#name8").html(data.holidays[8].name);
      $("#date8").html(
        Date.parse(data.holidays[8].date).toString("dS MMMM yyyy")
      );
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR, textStatus, errorThrown);
    },
  });

  $.ajax({
    url: "php/wiki.php",
    type: "GET",
    dataType: "JSON",
    data: {
      q: encodeURI($("#selCountry option:selected").text()),
      countryCode: $("#selCountry").val(),
    },

    success: function (results) {
      let data = results.data;
      console.log("wiki", results);
      $("#img1").attr("src", data.geonames[0].thumbnailImg);
      $("#wiki1").html(data.geonames[0].summary);
      $("#article1").attr("href", "http://" + data.geonames[0].wikipediaUrl);
      $("#img2").attr("src", data.geonames[1].thumbnailImg);
      $("#wiki2").html(data.geonames[1].summary);
      $("#article2").attr("href", "http://" + data.geonames[1].wikipediaUrl);
      $("#img3").attr("src", data.geonames[2].thumbnailImg);
      $("#wiki3").html(data.geonames[2].summary);
      $("#article3").attr("href", "http://" + data.geonames[2].wikipediaUrl);
      $("#img4").attr("src", data.geonames[3].thumbnailImg);
      $("#wiki4").html(data.geonames[3].summary);
      $("#article4").attr("href", "http://" + data.geonames[3].wikipediaUrl);
      $("#img5").attr("src", data.geonames[4].thumbnailImg);
      $("#wiki5").html(data.geonames[4].summary);
      $("#article5").attr("href", "http://" + data.geonames[4].wikipediaUrl);
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log("wiki", textStatus, errorThrown);
    },
  });

  //markers
  groupMarkers = L.markerClusterGroup();
  $.ajax({
    url: "php/mAirport.php",
    type: "POST",
    dataType: "JSON",
    data: { country: $("#selCountry").val() },

    success: function (results) {
      console.log("mAirport", results);
      let airports = [];
      let airportsMap = [];
      let airportM = L.ExtraMarkers.icon({
        icon: "fa-plane",
        markerColor: "blue",
        shape: "circle",
        prefix: "fa",
      });
      let data = results["data"]["geonames"];
      let leght = data.length;
      for (let i = 0; i < leght; i++) {
        let lat = data[i]["lat"];
        let long = data[i]["lng"];
        let name = data[i]["name"];
        airports.push([name, lat, long]);
      }
      for (let i = 0; i < airports.length; i++) {
        airportsMap = L.marker(new L.LatLng(airports[i][1], airports[i][2]), {
          icon: airportM,
        }).bindPopup(airports[i][0]);
        groupMarkers.addLayer(airportsMap);
      }
      map.addLayer(groupMarkers);
    },

    error: function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR, textStatus, errorThrown);
    },
  });

  $.ajax({
    url: "php/mBank.php",
    type: "POST",
    dataType: "JSON",
    data: { country: $("#selCountry").val() },

    success: function (results) {
      console.log("mBank", results);
      let banks = [];
      let banksMap = [];
      let bankM = L.ExtraMarkers.icon({
        icon: "fa-university",
        markerColor: "green",
        shape: "star",
        prefix: "fa",
      });
      let data = results["data"]["geonames"];
      let leght = data.length;
      for (let i = 0; i < leght; i++) {
        let lat = data[i]["lat"];
        let long = data[i]["lng"];
        let name = data[i]["name"];
        banks.push([name, lat, long]);
      }
      for (let i = 0; i < banks.length; i++) {
        banksMap = L.marker(new L.LatLng(banks[i][1], banks[i][2]), {
          icon: bankM,
        }).bindPopup(banks[i][0]);
        groupMarkers.addLayer(banksMap);
      }
      map.addLayer(groupMarkers);
    },

    error: function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR, textStatus, errorThrown);
    },
  });

  $.ajax({
    url: "php/mChurch.php",
    type: "POST",
    dataType: "JSON",
    data: { country: $("#selCountry").val() },

    success: function (results) {
      console.log("mChurch", results);
      let churches = [];
      let churchesMap = [];
      let churchM = L.ExtraMarkers.icon({
        icon: "fa-plus",
        markerColor: "black",
        shape: "square",
        prefix: "fa",
      });
      let data = results["data"]["geonames"];
      let leght = data.length;
      for (let i = 0; i < leght; i++) {
        let lat = data[i]["lat"];
        let long = data[i]["lng"];
        let name = data[i]["name"];
        churches.push([name, lat, long]);
      }
      for (let i = 0; i < churches.length; i++) {
        churchesMap = L.marker(new L.LatLng(churches[i][1], churches[i][2]), {
          icon: churchM,
        }).bindPopup(churches[i][0]);
        groupMarkers.addLayer(churchesMap);
      }
      map.addLayer(groupMarkers);
    },

    error: function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR, textStatus, errorThrown);
    },
  });

  $.ajax({
    url: "php/mHospital.php",
    type: "POST",
    dataType: "JSON",
    data: { country: $("#selCountry").val() },

    success: function (results) {
      console.log("mHospital", results);
      let hospitals = [];
      let hospitalsMap = [];
      let hospitalM = L.ExtraMarkers.icon({
        icon: "fa-h-square",
        markerColor: "red",
        shape: "square",
        prefix: "fa",
      });
      let data = results["data"]["geonames"];
      let leght = data.length;
      for (let i = 0; i < leght; i++) {
        let lat = data[i]["lat"];
        let long = data[i]["lng"];
        let name = data[i]["name"];
        hospitals.push([name, lat, long]);
      }
      for (let i = 0; i < hospitals.length; i++) {
        hospitalsMap = L.marker(
          new L.LatLng(hospitals[i][1], hospitals[i][2]),
          {
            icon: hospitalM,
          }
        ).bindPopup(hospitals[i][0]);
        groupMarkers.addLayer(hospitalsMap);
      }
      map.addLayer(groupMarkers);
    },

    error: function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR, textStatus, errorThrown);
    },
  });

  $.ajax({
    url: "php/mSchool.php",
    type: "POST",
    dataType: "JSON",
    data: { country: $("#selCountry").val() },

    success: function (results) {
      console.log("mSchool", results);
      let schools = [];
      let schoolsMap = [];
      let schoolM = L.ExtraMarkers.icon({
        icon: "fa-graduation-cap",
        markerColor: "yellow",
        shape: "penta",
        prefix: "fa",
      });
      let data = results["data"]["geonames"];
      let leght = data.length;
      for (let i = 0; i < leght; i++) {
        let lat = data[i]["lat"];
        let long = data[i]["lng"];
        let name = data[i]["name"];
        schools.push([name, lat, long]);
      }
      for (let i = 0; i < schools.length; i++) {
        schoolsMap = L.marker(new L.LatLng(schools[i][1], schools[i][2]), {
          icon: schoolM,
        }).bindPopup(schools[i][0]);
        groupMarkers.addLayer(schoolsMap);
      }
      map.addLayer(groupMarkers);
    },

    error: function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR, textStatus, errorThrown);
    },
  });
});

// easy button
L.easyButton(
  "fa fa-info",
  function () {
    $("#infoModal").modal("show");
  },
  "Information"
).addTo(map);

L.easyButton(
  "fa fa-usd",
  function () {
    $("#currencyModal").modal("show");
  },
  "Currency"
).addTo(map);

L.easyButton(
  "fa fa-cloud",
  function () {
    $("#weatherModal").modal("show");
  },
  "Weather"
).addTo(map);

L.easyButton(
  "fa fa-bar-chart",
  function () {
    $("#covidModal").modal("show");
  },
  "Covid"
).addTo(map);

L.easyButton(
  "fa fa-newspaper-o",
  function () {
    $("#newsModal").modal("show");
  },
  "News"
).addTo(map);

L.easyButton(
  "fa fa-calendar",
  function () {
    $("#holidayModal").modal("show");
  },
  "Holiday"
).addTo(map);

L.easyButton(
  "fa fa-wikipedia-w",
  function () {
    $("#wikiModal").modal("show");
  },
  "Wikipedia"
).addTo(map);
