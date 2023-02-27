# Gazetteer

Portflio Web Application. Project Specification from 'IT Career Switch'.

This application is a “mobile first“ website that is operate equally well on desktop computers. It provides profiling for all countries through thepresentation of demographic, climatic, geographical and other data. This is facilitated primarily through extensive use of APIs. I used the open source Leaflet library to display the map and overlays, along with the Bootstrap framework to ease the task of design.

# Program flow is:
- Display loader whilst HTML renders.
- JQuery onload to retrieve current location.
- Update map with currently selected country border.
- AJAX call to PHP routine to GeoNames using location data to return core information.
- AJAX calls to PHP routines to other API providers using information obtained from GeoNames.

# The application was developed using the following:
- HTML / CSS / SCSS and Bootsrap
- Javascript with jQuery and Leaflet
- PHP
