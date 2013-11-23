'use strict';

/* Controllers */

function CtrlSearch($scope, $route, $routeParams, $http, $q, searchForm){
  $scope.scientificNames=searchForm.getScientificName();
  $scope.vernacularNames=searchForm.getVernacularName();
  $scope.localities=searchForm.getLocality();
  $scope.latitudes=searchForm.getLatitude();
  $scope.longitudes=searchForm.getLongitude();
  $scope.boundingBoxes=searchForm.getBoundingBoxes();
  $scope.datapublishers=searchForm.getDatapublisher();
  $scope.datasets=searchForm.getDataset();
  $scope.dates=searchForm.getDate();
  $scope.georeferences = searchForm.getGeoreferencedData();
  $scope.datapublisherDataset = searchForm.getDatapublisherDataset();

  //Boolean for show the popup for the help
  $scope.isCollapsedCommun=false;
  $scope.isCollapsedScientific=true;
  $scope.isCollapsedLocality=true;
  $scope.isCollapsedLatitude=true;
  $scope.isCollapsedLongitude=true;
  $scope.isCollapsedGeoreferenced=true;
  $scope.isCollapsedDate=true;
  $scope.isCollapsedDatapublisher=true;
  $scope.isCollapsedDataset=false;

  $scope.latitudeFilter="<";
  $scope.longitudeFilter="<";

  // Function dedicated to the different filters of the research engine. 
  // Each function add its filter to the searchForm
  $scope.addScientificName = function() {
    searchForm.addScientificName($scope.scientificName);
    $scope.scientificName = '';
  };

  $scope.removeScientificName = function(index){
    searchForm.removeScientificName(index);
  }

  $scope.addVernacularName = function() {
    searchForm.addVernacularName($scope.vernacularName);
    $scope.vernacularName = '';
  };

  $scope.removeVernacularName = function(index){
    searchForm.removeVernacularName(index);
  }  

  $scope.addLocality = function(){
    searchForm.addLocality($scope.locality);
    $scope.locality = '';
  };

  $scope.removeLocality = function(index){
    searchForm.removeLocality(index);
  }; 

  $scope.addLatitude = function(){
    searchForm.addLatitude($scope.latitude, $scope.latitudeFilter);
    $scope.latitude = '';
  };

  $scope.removeLatitude = function(index){
    searchForm.removeLatitude(index);
  }; 

  $scope.addGeoreferencedData = function(){
    searchForm.addGeoreferencedData($scope.georeference);
    $scope.georeferences = searchForm.getGeoreferencedData();
  };

  $scope.addLongitude = function(){
    searchForm.addLongitude($scope.longitude, $scope.longitudeFilter);
    $scope.longitude = '';
  };

  $scope.removeLongitude= function(index){
    searchForm.removeLongitude(index);
  }; 

  //DEPRECIED
  $scope.addDatapublisher = function(){
    searchForm.addDatapublisher($scope.datapublisher);
    $scope.datapublisher = '';
  };
  //DEPRECIED
  $scope.addDataset = function(){
    searchForm.addDataset($scope.dataset);
    $scope.dataset = '';
  };

  $scope.addDatapublisherDataset = function(){
    var datapublisherName = $scope.dataPublisherList.filter(function(datapublisher){
      return datapublisher.id == $scope.datapublisher;
    })[0];
    var datasetName = $scope.datasetList.filter(function(dataset){
      return dataset.id == $scope.dataset;
    })[0];
    searchForm.addDatapublisherDataset(datapublisherName, datasetName);
    $scope.datapublisher = '';
    $scope.dataset = '';
  }

  $scope.removeDataset = function(index){
    searchForm.removeDataset(index);
  }

  $scope.addDate = function(){
    searchForm.addDate($scope.date);
    $scope.date = '';
  };

  $scope.removeDate = function(index){
    searchForm.removeDate(index);
  }

  var filterLayers = function(bounds) {
  }

  $scope.removeBoundingBox = function(bounds) {
    searchForm.removeBoundingBox(bounds);
    filterLayers(bounds);
    var a = searchForm.getBoundingBoxes();
    console.log(a + []);
    $scope.boundingBoxes = a;
  }

  // Function dedicated to the map for the bounding box
  // Only initiate the map on the map view
  if ($route.current.templateUrl == "portal/search/search.geo.html") {
    var franceMetropolitan = new L.LatLng(47.0176, 2.3427);

    var map = L.map('search-map', {
      zoomControl: false,
      dragging: false,
      center: franceMetropolitan,
      zoom: 5
    });

    var layers = [];
    var addBoundingBox = function(bounds) {
      var layer = L.rectangle(bounds, {
        color: '#d62727',
      })
      layer.addTo(map);

      // Store bounding box in service
      searchForm.addBoundingBox(bounds);

      // Store layers in case we want to remove them
      layers.push({bounds: bounds, layer: layer});
    }

    filterLayers = function(bounds) {
      layers = layers.filter(function(b){
        if (b.bounds == bounds) {
          map.removeLayer(b.layer)
        }
      });
    };

    // Bounding box controls
    var drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        // Disable all controls
        polyline: false,
        polygon: false,
        marker: false,
        circle: false,
        // Activate rectangle
        rectangle: {
          allowIntersection: false,
          drawError: {
            color: '#b00b00',
            timeout: 1000
          },
          shapeOptions: {
            color: '#d62727',
            clickable: false
          }
        }
      }
    });

    map.addControl(drawControl);
    map.on('draw:created', function (e) {
      var type = e.layerType,
          layer = e.layer;

      // Only add rectangle layer types
      if (type === 'rectangle') {
        addBoundingBox(layer.getBounds());
        // Trigger the reload of layers
        $scope.$digest();
      }
    });

    // Fond de carte
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/examples.map-dev-fr/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://mapbox.org">MapBox</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18,
        noWrap: true
    }).addTo(map);

    $scope.boundingBoxes.map(function (bounds) {

    });
  }

  // Generic function for the autocomplete
  var autocomplete = function(url, mapper){
    return function(name){
      // Create the promise box 
      var nameList = $q.defer();

      $http.get(url+name).
        success(function(data, status) {
          nameList.resolve([].concat.apply([], data.map(mapper)));
        }).
        error(function(data, status) {
          nameList.resolve(["Erreur " + status]);
      });
      return nameList.promise;
    }
  }

  //Functions for the autocompletion for the different fields of the research engine
  $scope.autocompleteScientificName =  autocomplete("http://api.gbif.org/v0.9/species/suggest?datasetkey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&limit=20&q=", 
    function(taxa){ 
      return [taxa.canonicalName];
    });

  $scope.autocompleteVernacularName =  autocomplete(
    "http://api.gbif.org/v0.9/species/suggest?datasetkey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c&limit=20&q=", 
    function(taxa){ 
      return taxa.vernacularNames.filter(function(vernacularName){
          return vernacularName.language=="FRENCH";
      }).map(function(vernacularNameObject){
        return vernacularNameObject.vernacularName;
      });
    });

  $scope.autocompleteLocality = autocomplete("http://nominatim.openstreetmap.org/search/?format=json&limit=10&q=",
    function(locality){
        return [locality.display_name];
    });


  $http.get("/json/datapublisher.json").
    success(function(data, status) {
      $scope.dataPublisherList = data.map(function(taxa){ return {name:taxa.name, id:taxa.id};});

    }).
    error(function(data, status) {
      $scope.dataPublisherList =["Erreur" + status];
    });

  $http.get("/json/dataset.json").
    success(function(data, status) {
      $scope.datasetList = data.map(function(taxa){ return {name:taxa.name, id:taxa.id, datapubliserId:taxa.datapubliserId};});
    }).
    error(function(data, status) {
      $scope.datasetList =["Erreur" + status];
    });


}


myApp.controller('CtrlSearch', ['$scope', '$route', '$routeParams', '$http', '$q', 'searchForm', CtrlSearch]);
