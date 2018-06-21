import Scene from './scene';
import Geo from './geo';

export function init(layer) {
  var scene = layer.scene;
  var view = scene.view;
  var camera = view.camera;

  scene.canvas.onmousedown = handleMouseDown;
  scene.canvas.onmouseup = handleMouseUp;
  scene.canvas.onmouseleave = handleMouseUp;
  scene.canvas.onmousemove = handleMouseMove;
  scene.container.onwheel = handleScroll;

  // track mouse state
  var mouseDown = false;
  var lastMouseX = null;
  var lastMouseY = null;

  // track drag screen position
  var startingX = 0;
  var startingY = 0;

  // track drag distance from the starting position
  var deltaX = 0;
  var deltaY = 0;
  var orbitDeltaX = null;
  var orbitDeltaY = null;

  // track drag starting map position
  var startingLng = view.center.meters.x;
  var startingLat = view.center.meters.y;

  // track drag distance from the starting map position
  var metersDeltaX = null;
  var metersDeltaY = null;

  // track modifier key state
  var metaKeyDown = false;

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function handleMouseDown (event) {
      mouseDown = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
  }

  function handleMouseUp (event) {
      mouseDown = false;
      lastMouseX = null;
      lastMouseY = null;
      // track last drag offset and apply that as offset to the next drag –
      // otherwise camera resets position and rotation with each drag
      startingX = orbitDeltaX;
      startingY = orbitDeltaY;
      startingLng = view.center.meters.x;
      startingLat = view.center.meters.y;
      deltaX = 0;
      deltaY = 0;
  }

  function resetMouseEventVars(event) {
    handleMouseUp(event);
    handleMouseDown(event);
  }

  function handleMouseMove (event) {
    if (!mouseDown) {
        return;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    deltaX = newX - lastMouseX;
    deltaY = newY - lastMouseY;

    if (event.metaKey) { // orbit camera
      if (!metaKeyDown) { // meta key pressed during drag, fake a mouseup/mousedown
        resetMouseEventVars(event);
      }
      metaKeyDown = true;
      orbitDeltaX = startingX + newX - lastMouseX;
      orbitDeltaY = startingY + newY - lastMouseY;
      camera.roll = degToRad(orbitDeltaX * .1);
      camera.pitch = degToRad(orbitDeltaY * .1);
      view.roll = camera.roll;
      view.pitch = camera.pitch;

    } else { // basic pan
      if (metaKeyDown) { // meta key was just released during drag, fake a mouseup/mousedown
        resetMouseEventVars(event);
      } else {
        metersDeltaX = deltaX * Geo.metersPerPixel(view.zoom);
        metersDeltaY = deltaY * Geo.metersPerPixel(view.zoom);

        var cosRoll = Math.cos(scene.view.roll);
        var adjustedDeltaX = metersDeltaX * cosRoll + metersDeltaY * Math.sin(scene.view.roll + Math.PI);
        var adjustedDeltaY = metersDeltaY * cosRoll + metersDeltaX * Math.sin(scene.view.roll);

        var deltaLatLng = Geo.metersToLatLng([startingLng - adjustedDeltaX, startingLat + adjustedDeltaY]);
        view.setView({lng: deltaLatLng[0], lat: deltaLatLng[1]});
      }
      metaKeyDown = false;
    }
    camera.update();
    scene.tile_manager.updateLabels();
  }

  function handleScroll (event) {
    view.setZoom(view.zoom -= event.deltaY * .01);
    return false;
  }
}