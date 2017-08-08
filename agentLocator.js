var map;
var markers = [];
var infoWindow;
var locSelect;


/*Purpose: Set up and allow map to select location and center*/
function initMap() {
    /*Centers map around Warwick*/
    var warwick = {lat: 41.700757, lng: -71.420334};
    map = new google.maps.Map(document.getElementById('map'), {
        center: warwick,
        zoom: 11,
        /*change from roadMap??*/
        mapTypeId: 'roadmap',
        mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU}
    });

    infoWindow = new google.maps.InfoWindow();
    searchButton = document.getElementById("searchButton").onclick = searchLocations;

    /*Picking location*/
    locSelect = document.getElementById("locSelect");
    locSelect.onchange = function() {
        var markerNum = locSelect.options[locSelect.selectedIndex].value;
        if(markerNum !== "none")
            google.maps.event.trigger(markers[markerNum], 'click');
    };

    /*Geolocates user if given consent*/
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            infoWindow.open(map);
            map.setCenter(pos);
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}


/*Purpose: Searching for a  location*/
function searchLoc(){
    var address =  document.getElementById('addressInput').value;
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({address: address}, function(results, status) {
        if(status === google.maps.Geocoder.OK)
            searchLocationsNear(results[0].geometry.location);
        else
            alert(address + 'not found');
    });
}


/*Purpose: clear all locations*/
function clearLoc() {
    infoWindow.close();
    for (var i = 0; i < markers.length; i++){
        marker[i].setMap(null);
    }
    markers.length = 0;

    locSelect.innerHTML = "";
    var option = document.createElement("option");
    option.value = "none";
    option.innerHTML = "See all results:";
    locationSelect.appendChild(option);
}


/*Purpose: Finds loc near an address*/
function searchLocNear(center) {
    clearLoc();

    var radius = document.getElementById('radiusSelect').value;
    var searchUrl = 'storelocator.php?lat=' + center.lat() + '&lng=' + center.lng() + '&radius=' + radius;

    downloadUrl(searchUrl, function(data){
        var xml = parseXml(data);
        var markerNodes = xml.documentElement.getElementsByTagName("marker");
        var bounds = new google.maps.LatLngBounds();

        for(var i = 0; i < markerNodes.length; i++){
            var id = markerNodes[i].getAttribute("id");
            var name = markerNodes[i].getAttribute("name");
            var address = markerNodes[i].getAttribute("address");
            var distance = parseFloat(markerNodes[i].getAttribute("distance"));
            var latLng = new google.maps.LatLng(
                parseFloat(markerNodes[i].getAttribute("lat")),
                parseFloat(markerNodes[i].getAttribute("lng"))
            );

            createOption(name, distance, i);
            createMarker(latLng, name, address);
            bounds.extend(latLng);
        }

        map.fitBounds(bounds);
        locSelect.style.visibility = "visible";
        locSelect.onchange = function(){
            var markerNum = locSelect.options[locSelect.selectedIndex].value;
            google.maps.event.trigger(markers[markerNum], 'click');
        };
    });
}


/*Purpose: creates a marker*/
function createMarker(latLng, name, address){
    var html = "<b>" + name + "</b> <br/>" + address;
    var marker = new google.maps.Marker({
        map: map,
        position: latLng
    });

    google.maps.event.addListener(marker, 'click', function(){
        infoWindow.setContent(html);
        infoWindow.open(map, marker);
    });
    markers.push(marker);
}


/*Purpose: create an option*/
function createOption(name, distance, num) {
    var option = document.createElement("option");
    option.value = num;
    option.innerHTML = name;
    locSelect.appendChild(option);
}


/*Purpose: downloads the URL*/
function downloadUrl(url, callback){
    var request = window.ActiveXObject ?
        new ActiveXObject('Microsoft.XMLHTTP') :
        new XMLHttpRequest;

    request.onreadystatechange = function() {
        if (request.readyState == 4){
            request.onreadystatechange = doNothing;
            callback(request.responseText, request.status);
        }
    };

    request.open('GET', url, true);
    request.send(null);
}


/*Purpose: parsing xml*/
function parseXml(str) {
    if(window.ActiveXObject){
        var doc = new ActiveXObject('Microsoft.XMLDOM');
        doc.loadXML(str);
        return doc;
    }
    else if(window.DOMParser){
        return (new DOMParser).parseFromString(str, 'text/xml');
    }
}


/*Purpose: does absolutely nothing*/
function doNothing(){}


/*Purpose: Shows error message if geolocator has failed*/
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}