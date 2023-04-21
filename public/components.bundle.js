(function (designSystem, React$2, styled, adminjs, reactRedux) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React$2);
  var styled__default = /*#__PURE__*/_interopDefaultLegacy(styled);

  function _iterableToArrayLimit(arr, i) {
    var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"];
    if (null != _i) {
      var _s,
        _e,
        _x,
        _r,
        _arr = [],
        _n = !0,
        _d = !1;
      try {
        if (_x = (_i = _i.call(arr)).next, 0 === i) {
          if (Object(_i) !== _i) return;
          _n = !1;
        } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0);
      } catch (err) {
        _d = !0, _e = err;
      } finally {
        try {
          if (!_n && null != _i.return && (_r = _i.return(), Object(_r) !== _r)) return;
        } finally {
          if (_d) throw _e;
        }
      }
      return _arr;
    }
  }
  function _taggedTemplateLiteral(strings, raw) {
    if (!raw) {
      raw = strings.slice(0);
    }
    return Object.freeze(Object.defineProperties(strings, {
      raw: {
        value: Object.freeze(raw)
      }
    }));
  }
  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }
  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  var lib = {};

  Object.defineProperty(lib, '__esModule', { value: true });

  var React$1 = React__default["default"];

  const LEFT = "Left";
  const RIGHT = "Right";
  const UP = "Up";
  const DOWN = "Down";

  /* global document */
  const defaultProps = {
      delta: 10,
      preventScrollOnSwipe: false,
      rotationAngle: 0,
      trackMouse: false,
      trackTouch: true,
      swipeDuration: Infinity,
      touchEventOptions: { passive: true },
  };
  const initialState = {
      first: true,
      initial: [0, 0],
      start: 0,
      swiping: false,
      xy: [0, 0],
  };
  const mouseMove = "mousemove";
  const mouseUp = "mouseup";
  const touchEnd = "touchend";
  const touchMove = "touchmove";
  const touchStart = "touchstart";
  function getDirection(absX, absY, deltaX, deltaY) {
      if (absX > absY) {
          if (deltaX > 0) {
              return RIGHT;
          }
          return LEFT;
      }
      else if (deltaY > 0) {
          return DOWN;
      }
      return UP;
  }
  function rotateXYByAngle(pos, angle) {
      if (angle === 0)
          return pos;
      const angleInRadians = (Math.PI / 180) * angle;
      const x = pos[0] * Math.cos(angleInRadians) + pos[1] * Math.sin(angleInRadians);
      const y = pos[1] * Math.cos(angleInRadians) - pos[0] * Math.sin(angleInRadians);
      return [x, y];
  }
  function getHandlers(set, handlerProps) {
      const onStart = (event) => {
          const isTouch = "touches" in event;
          // if more than a single touch don't track, for now...
          if (isTouch && event.touches.length > 1)
              return;
          set((state, props) => {
              // setup mouse listeners on document to track swipe since swipe can leave container
              if (props.trackMouse && !isTouch) {
                  document.addEventListener(mouseMove, onMove);
                  document.addEventListener(mouseUp, onUp);
              }
              const { clientX, clientY } = isTouch ? event.touches[0] : event;
              const xy = rotateXYByAngle([clientX, clientY], props.rotationAngle);
              props.onTouchStartOrOnMouseDown &&
                  props.onTouchStartOrOnMouseDown({ event });
              return Object.assign(Object.assign(Object.assign({}, state), initialState), { initial: xy.slice(), xy, start: event.timeStamp || 0 });
          });
      };
      const onMove = (event) => {
          set((state, props) => {
              const isTouch = "touches" in event;
              // Discount a swipe if additional touches are present after
              // a swipe has started.
              if (isTouch && event.touches.length > 1) {
                  return state;
              }
              // if swipe has exceeded duration stop tracking
              if (event.timeStamp - state.start > props.swipeDuration) {
                  return state.swiping ? Object.assign(Object.assign({}, state), { swiping: false }) : state;
              }
              const { clientX, clientY } = isTouch ? event.touches[0] : event;
              const [x, y] = rotateXYByAngle([clientX, clientY], props.rotationAngle);
              const deltaX = x - state.xy[0];
              const deltaY = y - state.xy[1];
              const absX = Math.abs(deltaX);
              const absY = Math.abs(deltaY);
              const time = (event.timeStamp || 0) - state.start;
              const velocity = Math.sqrt(absX * absX + absY * absY) / (time || 1);
              const vxvy = [deltaX / (time || 1), deltaY / (time || 1)];
              const dir = getDirection(absX, absY, deltaX, deltaY);
              // if swipe is under delta and we have not started to track a swipe: skip update
              const delta = typeof props.delta === "number"
                  ? props.delta
                  : props.delta[dir.toLowerCase()] ||
                      defaultProps.delta;
              if (absX < delta && absY < delta && !state.swiping)
                  return state;
              const eventData = {
                  absX,
                  absY,
                  deltaX,
                  deltaY,
                  dir,
                  event,
                  first: state.first,
                  initial: state.initial,
                  velocity,
                  vxvy,
              };
              // call onSwipeStart if present and is first swipe event
              eventData.first && props.onSwipeStart && props.onSwipeStart(eventData);
              // call onSwiping if present
              props.onSwiping && props.onSwiping(eventData);
              // track if a swipe is cancelable (handler for swiping or swiped(dir) exists)
              // so we can call preventDefault if needed
              let cancelablePageSwipe = false;
              if (props.onSwiping ||
                  props.onSwiped ||
                  props[`onSwiped${dir}`]) {
                  cancelablePageSwipe = true;
              }
              if (cancelablePageSwipe &&
                  props.preventScrollOnSwipe &&
                  props.trackTouch &&
                  event.cancelable) {
                  event.preventDefault();
              }
              return Object.assign(Object.assign({}, state), { 
                  // first is now always false
                  first: false, eventData, swiping: true });
          });
      };
      const onEnd = (event) => {
          set((state, props) => {
              let eventData;
              if (state.swiping && state.eventData) {
                  // if swipe is less than duration fire swiped callbacks
                  if (event.timeStamp - state.start < props.swipeDuration) {
                      eventData = Object.assign(Object.assign({}, state.eventData), { event });
                      props.onSwiped && props.onSwiped(eventData);
                      const onSwipedDir = props[`onSwiped${eventData.dir}`];
                      onSwipedDir && onSwipedDir(eventData);
                  }
              }
              else {
                  props.onTap && props.onTap({ event });
              }
              props.onTouchEndOrOnMouseUp && props.onTouchEndOrOnMouseUp({ event });
              return Object.assign(Object.assign(Object.assign({}, state), initialState), { eventData });
          });
      };
      const cleanUpMouse = () => {
          // safe to just call removeEventListener
          document.removeEventListener(mouseMove, onMove);
          document.removeEventListener(mouseUp, onUp);
      };
      const onUp = (e) => {
          cleanUpMouse();
          onEnd(e);
      };
      /**
       * The value of passive on touchMove depends on `preventScrollOnSwipe`:
       * - true => { passive: false }
       * - false => { passive: true } // Default
       *
       * NOTE: When preventScrollOnSwipe is true, we attempt to call preventDefault to prevent scroll.
       *
       * props.touchEventOptions can also be set for all touch event listeners,
       * but for `touchmove` specifically when `preventScrollOnSwipe` it will
       * supersede and force passive to false.
       *
       */
      const attachTouch = (el, props) => {
          let cleanup = () => { };
          if (el && el.addEventListener) {
              const baseOptions = Object.assign(Object.assign({}, defaultProps.touchEventOptions), props.touchEventOptions);
              // attach touch event listeners and handlers
              const tls = [
                  [touchStart, onStart, baseOptions],
                  // preventScrollOnSwipe option supersedes touchEventOptions.passive
                  [
                      touchMove,
                      onMove,
                      Object.assign(Object.assign({}, baseOptions), (props.preventScrollOnSwipe ? { passive: false } : {})),
                  ],
                  [touchEnd, onEnd, baseOptions],
              ];
              tls.forEach(([e, h, o]) => el.addEventListener(e, h, o));
              // return properly scoped cleanup method for removing listeners, options not required
              cleanup = () => tls.forEach(([e, h]) => el.removeEventListener(e, h));
          }
          return cleanup;
      };
      const onRef = (el) => {
          // "inline" ref functions are called twice on render, once with null then again with DOM element
          // ignore null here
          if (el === null)
              return;
          set((state, props) => {
              // if the same DOM el as previous just return state
              if (state.el === el)
                  return state;
              const addState = {};
              // if new DOM el clean up old DOM and reset cleanUpTouch
              if (state.el && state.el !== el && state.cleanUpTouch) {
                  state.cleanUpTouch();
                  addState.cleanUpTouch = void 0;
              }
              // only attach if we want to track touch
              if (props.trackTouch && el) {
                  addState.cleanUpTouch = attachTouch(el, props);
              }
              // store event attached DOM el for comparison, clean up, and re-attachment
              return Object.assign(Object.assign(Object.assign({}, state), { el }), addState);
          });
      };
      // set ref callback to attach touch event listeners
      const output = {
          ref: onRef,
      };
      // if track mouse attach mouse down listener
      if (handlerProps.trackMouse) {
          output.onMouseDown = onStart;
      }
      return [output, attachTouch];
  }
  function updateTransientState(state, props, previousProps, attachTouch) {
      // if trackTouch is off or there is no el, then remove handlers if necessary and exit
      if (!props.trackTouch || !state.el) {
          if (state.cleanUpTouch) {
              state.cleanUpTouch();
          }
          return Object.assign(Object.assign({}, state), { cleanUpTouch: undefined });
      }
      // trackTouch is on, so if there are no handlers attached, attach them and exit
      if (!state.cleanUpTouch) {
          return Object.assign(Object.assign({}, state), { cleanUpTouch: attachTouch(state.el, props) });
      }
      // trackTouch is on and handlers are already attached, so if preventScrollOnSwipe changes value,
      // remove and reattach handlers (this is required to update the passive option when attaching
      // the handlers)
      if (props.preventScrollOnSwipe !== previousProps.preventScrollOnSwipe ||
          props.touchEventOptions.passive !== previousProps.touchEventOptions.passive) {
          state.cleanUpTouch();
          return Object.assign(Object.assign({}, state), { cleanUpTouch: attachTouch(state.el, props) });
      }
      return state;
  }
  function useSwipeable(options) {
      const { trackMouse } = options;
      const transientState = React$1.useRef(Object.assign({}, initialState));
      const transientProps = React$1.useRef(Object.assign({}, defaultProps));
      // track previous rendered props
      const previousProps = React$1.useRef(Object.assign({}, transientProps.current));
      previousProps.current = Object.assign({}, transientProps.current);
      // update current render props & defaults
      transientProps.current = Object.assign(Object.assign({}, defaultProps), options);
      // Force defaults for config properties
      let defaultKey;
      for (defaultKey in defaultProps) {
          if (transientProps.current[defaultKey] === void 0) {
              transientProps.current[defaultKey] = defaultProps[defaultKey];
          }
      }
      const [handlers, attachTouch] = React$1.useMemo(() => getHandlers((stateSetter) => (transientState.current = stateSetter(transientState.current, transientProps.current)), { trackMouse }), [trackMouse]);
      transientState.current = updateTransientState(transientState.current, transientProps.current, previousProps.current, attachTouch);
      return handlers;
  }

  lib.DOWN = DOWN;
  lib.LEFT = LEFT;
  lib.RIGHT = RIGHT;
  lib.UP = UP;
  var useSwipeable_1 = lib.useSwipeable = useSwipeable;

  var toggler;
  var TopBar = function TopBar(props) {
    var _useCurrentAdmin = adminjs.useCurrentAdmin(),
      _useCurrentAdmin2 = _slicedToArray(_useCurrentAdmin, 2),
      currentAdmin = _useCurrentAdmin2[0];
      _useCurrentAdmin2[1];
    var toggleSidebar = props.toggleSidebar;
    toggler = toggleSidebar;
    var _useSelector = reactRedux.useSelector(function (state) {
        return [state.session, state.paths, state.versions];
      }),
      _useSelector2 = _slicedToArray(_useSelector, 3);
      _useSelector2[0];
      _useSelector2[1];
      _useSelector2[2];
    return /*#__PURE__*/React.createElement(designSystem.Box, {
      border: "0px",
      flex: true,
      flexDirection: "row-reverse",
      height: "navbarHeight",
      className: "topbar"
    }, /*#__PURE__*/React.createElement(designSystem.CurrentUserNav, {
      dropActions: [{
        icon: 'Logout',
        label: 'Log out',
        href: '/admin/logout',
        onClick: function noRefCheck() {}
      }],
      lineActions: [{
        icon: 'Continue',
        label: 'Sidebar',
        onClick: toggleSidebar
      }, {
        icon: 'Help',
        label: 'Help',
        href: 'https://discord.gg/FrxXABtE',
        onClick: function noRefCheck() {}
      }],
      name: currentAdmin.name,
      title: currentAdmin.role
    }));
  };

  var _templateObject;
  var api = new adminjs.ApiClient();
  var Dashboard = function Dashboard() {
    var _useState = React$2.useState(''),
      _useState2 = _slicedToArray(_useState, 2);
      _useState2[0];
      var setText = _useState2[1];
    var _useState3 = React$2.useState(''),
      _useState4 = _slicedToArray(_useState3, 2),
      subscription = _useState4[0],
      setSubscription = _useState4[1];
    var _useState5 = React$2.useState(''),
      _useState6 = _slicedToArray(_useState5, 2),
      stat = _useState6[0],
      setStat = _useState6[1];
    var _useState7 = React$2.useState(''),
      _useState8 = _slicedToArray(_useState7, 2),
      logs = _useState8[0],
      setLogs = _useState8[1];
    var _useState9 = React$2.useState(''),
      _useState10 = _slicedToArray(_useState9, 2),
      ping = _useState10[0],
      setPing = _useState10[1];
    var _useState11 = React$2.useState(''),
      _useState12 = _slicedToArray(_useState11, 2),
      user = _useState12[0],
      setUser = _useState12[1];
    var handlers = useSwipeable_1({
      onSwipedRight: function onSwipedRight() {
        return toggler();
      },
      swipeDuration: 500,
      preventScrollOnSwipe: true,
      trackMouse: false
    });
    adminjs.useNotice();
    React$2.useEffect(function () {
      api.getDashboard().then(function (res) {
        setText(res.data.text);
        setSubscription(res.data.subscription_type.subscription);
        setStat(res.data.stat.isActive);
        setLogs(res.data.logs);
        setPing(res.data.ping);
        setUser(res.data.user.name);
      });
    });
    var Card = styled__default["default"](designSystem.Box)(_templateObject || (_templateObject = _taggedTemplateLiteral(["\n  height: 100%;\n  "])));
    return /*#__PURE__*/React__default["default"].createElement("div", handlers, /*#__PURE__*/React__default["default"].createElement(designSystem.Box, {
      variant: "white",
      className: "height"
    }, /*#__PURE__*/React__default["default"].createElement(Card, {
      variant: "white",
      className: "angry-grid"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      id: "item-0"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card-details"
    }, /*#__PURE__*/React__default["default"].createElement("p", {
      className: "text-title"
    }, "Username"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "text-body"
    }, user !== null && user !== void 0 && user.length ? /*#__PURE__*/React__default["default"].createElement("pre", null, user) : /*#__PURE__*/React__default["default"].createElement(designSystem.Placeholder, {
      style: {
        width: 100,
        height: 14
      }
    }))))), /*#__PURE__*/React__default["default"].createElement("div", {
      id: "item-1"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card-details"
    }, /*#__PURE__*/React__default["default"].createElement("p", {
      className: "text-title"
    }, "Subscription"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "text-body"
    }, subscription !== null && subscription !== void 0 && subscription.length ? /*#__PURE__*/React__default["default"].createElement("pre", null, subscription) : /*#__PURE__*/React__default["default"].createElement(designSystem.Placeholder, {
      style: {
        width: 100,
        height: 14
      }
    }))))), /*#__PURE__*/React__default["default"].createElement("div", {
      id: "item-2"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card-details"
    }, /*#__PURE__*/React__default["default"].createElement("p", {
      className: "text-title"
    }, "Status"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "text-body"
    }, stat == 'Active' ? /*#__PURE__*/React__default["default"].createElement("pre", null, /*#__PURE__*/React__default["default"].createElement(designSystem.Badge, {
      variant: "success"
    }, "Active")) : /*#__PURE__*/React__default["default"].createElement(designSystem.Badge, {
      variant: "danger"
    }, "Offline"))))), /*#__PURE__*/React__default["default"].createElement("div", {
      id: "item-3"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card-details"
    }, /*#__PURE__*/React__default["default"].createElement("p", {
      className: "text-title"
    }, "Announcements"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "text-body"
    }, ping !== null && ping !== void 0 && ping.length ? /*#__PURE__*/React__default["default"].createElement("pre", null, /*#__PURE__*/React__default["default"].createElement("p", null, ping[0].announcement, " at ", ping[0].createdAt.split('T')[0]), /*#__PURE__*/React__default["default"].createElement("p", null, ping[1].announcement, " at ", ping[1].createdAt.split('T')[0]), /*#__PURE__*/React__default["default"].createElement("p", null, ping[2].announcement, " at ", ping[2].createdAt.split('T')[0])) : /*#__PURE__*/React__default["default"].createElement(designSystem.Badge, {
      variant: "danger"
    }, "Nothing"))))), /*#__PURE__*/React__default["default"].createElement("div", {
      id: "item-4"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card-details"
    }, /*#__PURE__*/React__default["default"].createElement("p", {
      className: "text-title"
    }, "Anti Exploit"), /*#__PURE__*/React__default["default"].createElement("p", {
      className: "text-body"
    }, "Lorem ipsum sit dolor amet lorem ipsum")))), /*#__PURE__*/React__default["default"].createElement("div", {
      id: "item-5"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card daily"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "card-details"
    }, /*#__PURE__*/React__default["default"].createElement("p", {
      className: "text-title"
    }, "Daily"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "text-body"
    }, logs !== null && logs !== void 0 && logs.length ? /*#__PURE__*/React__default["default"].createElement("pre", null, /*#__PURE__*/React__default["default"].createElement("p", null, logs[0].description, " at ", logs[0].createdAt.split('T')[0]), /*#__PURE__*/React__default["default"].createElement("p", null, logs[1].description, " at ", logs[1].createdAt.split('T')[0]), /*#__PURE__*/React__default["default"].createElement("p", null, logs[2].description, " at ", logs[2].createdAt.split('T')[0])) : /*#__PURE__*/React__default["default"].createElement(designSystem.Badge, {
      variant: "danger"
    }, "Nothing"))))))), /*#__PURE__*/React__default["default"].createElement("footer", {
      className: "footer-content"
    }, /*#__PURE__*/React__default["default"].createElement("div", null, "Aspect Systems | All rights reserved.")));
  };

  AdminJS.UserComponents = {};
  AdminJS.UserComponents.Component0 = Dashboard;
  AdminJS.UserComponents.TopBar = TopBar;
  AdminJS.UserComponents.Component1 = Dashboard;
  AdminJS.UserComponents.Dashboard = Dashboard;

})(AdminJSDesignSystem, React, styled, AdminJS, ReactRedux);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvcmVhY3Qtc3dpcGVhYmxlL2xpYi9pbmRleC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL25hdmJhci5qc3giLCIuLi9zcmMvY29tcG9uZW50cy9teS1kYXNoYm9hcmQtY29tcG9uZW50LmpzeCIsIi5lbnRyeS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbmNvbnN0IExFRlQgPSBcIkxlZnRcIjtcbmNvbnN0IFJJR0hUID0gXCJSaWdodFwiO1xuY29uc3QgVVAgPSBcIlVwXCI7XG5jb25zdCBET1dOID0gXCJEb3duXCI7XG5cbi8qIGdsb2JhbCBkb2N1bWVudCAqL1xuY29uc3QgZGVmYXVsdFByb3BzID0ge1xuICAgIGRlbHRhOiAxMCxcbiAgICBwcmV2ZW50U2Nyb2xsT25Td2lwZTogZmFsc2UsXG4gICAgcm90YXRpb25BbmdsZTogMCxcbiAgICB0cmFja01vdXNlOiBmYWxzZSxcbiAgICB0cmFja1RvdWNoOiB0cnVlLFxuICAgIHN3aXBlRHVyYXRpb246IEluZmluaXR5LFxuICAgIHRvdWNoRXZlbnRPcHRpb25zOiB7IHBhc3NpdmU6IHRydWUgfSxcbn07XG5jb25zdCBpbml0aWFsU3RhdGUgPSB7XG4gICAgZmlyc3Q6IHRydWUsXG4gICAgaW5pdGlhbDogWzAsIDBdLFxuICAgIHN0YXJ0OiAwLFxuICAgIHN3aXBpbmc6IGZhbHNlLFxuICAgIHh5OiBbMCwgMF0sXG59O1xuY29uc3QgbW91c2VNb3ZlID0gXCJtb3VzZW1vdmVcIjtcbmNvbnN0IG1vdXNlVXAgPSBcIm1vdXNldXBcIjtcbmNvbnN0IHRvdWNoRW5kID0gXCJ0b3VjaGVuZFwiO1xuY29uc3QgdG91Y2hNb3ZlID0gXCJ0b3VjaG1vdmVcIjtcbmNvbnN0IHRvdWNoU3RhcnQgPSBcInRvdWNoc3RhcnRcIjtcbmZ1bmN0aW9uIGdldERpcmVjdGlvbihhYnNYLCBhYnNZLCBkZWx0YVgsIGRlbHRhWSkge1xuICAgIGlmIChhYnNYID4gYWJzWSkge1xuICAgICAgICBpZiAoZGVsdGFYID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFJJR0hUO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBMRUZUO1xuICAgIH1cbiAgICBlbHNlIGlmIChkZWx0YVkgPiAwKSB7XG4gICAgICAgIHJldHVybiBET1dOO1xuICAgIH1cbiAgICByZXR1cm4gVVA7XG59XG5mdW5jdGlvbiByb3RhdGVYWUJ5QW5nbGUocG9zLCBhbmdsZSkge1xuICAgIGlmIChhbmdsZSA9PT0gMClcbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICBjb25zdCBhbmdsZUluUmFkaWFucyA9IChNYXRoLlBJIC8gMTgwKSAqIGFuZ2xlO1xuICAgIGNvbnN0IHggPSBwb3NbMF0gKiBNYXRoLmNvcyhhbmdsZUluUmFkaWFucykgKyBwb3NbMV0gKiBNYXRoLnNpbihhbmdsZUluUmFkaWFucyk7XG4gICAgY29uc3QgeSA9IHBvc1sxXSAqIE1hdGguY29zKGFuZ2xlSW5SYWRpYW5zKSAtIHBvc1swXSAqIE1hdGguc2luKGFuZ2xlSW5SYWRpYW5zKTtcbiAgICByZXR1cm4gW3gsIHldO1xufVxuZnVuY3Rpb24gZ2V0SGFuZGxlcnMoc2V0LCBoYW5kbGVyUHJvcHMpIHtcbiAgICBjb25zdCBvblN0YXJ0ID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGlzVG91Y2ggPSBcInRvdWNoZXNcIiBpbiBldmVudDtcbiAgICAgICAgLy8gaWYgbW9yZSB0aGFuIGEgc2luZ2xlIHRvdWNoIGRvbid0IHRyYWNrLCBmb3Igbm93Li4uXG4gICAgICAgIGlmIChpc1RvdWNoICYmIGV2ZW50LnRvdWNoZXMubGVuZ3RoID4gMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgc2V0KChzdGF0ZSwgcHJvcHMpID0+IHtcbiAgICAgICAgICAgIC8vIHNldHVwIG1vdXNlIGxpc3RlbmVycyBvbiBkb2N1bWVudCB0byB0cmFjayBzd2lwZSBzaW5jZSBzd2lwZSBjYW4gbGVhdmUgY29udGFpbmVyXG4gICAgICAgICAgICBpZiAocHJvcHMudHJhY2tNb3VzZSAmJiAhaXNUb3VjaCkge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIobW91c2VNb3ZlLCBvbk1vdmUpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIobW91c2VVcCwgb25VcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGlzVG91Y2ggPyBldmVudC50b3VjaGVzWzBdIDogZXZlbnQ7XG4gICAgICAgICAgICBjb25zdCB4eSA9IHJvdGF0ZVhZQnlBbmdsZShbY2xpZW50WCwgY2xpZW50WV0sIHByb3BzLnJvdGF0aW9uQW5nbGUpO1xuICAgICAgICAgICAgcHJvcHMub25Ub3VjaFN0YXJ0T3JPbk1vdXNlRG93biAmJlxuICAgICAgICAgICAgICAgIHByb3BzLm9uVG91Y2hTdGFydE9yT25Nb3VzZURvd24oeyBldmVudCB9KTtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCBpbml0aWFsU3RhdGUpLCB7IGluaXRpYWw6IHh5LnNsaWNlKCksIHh5LCBzdGFydDogZXZlbnQudGltZVN0YW1wIHx8IDAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3Qgb25Nb3ZlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHNldCgoc3RhdGUsIHByb3BzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpc1RvdWNoID0gXCJ0b3VjaGVzXCIgaW4gZXZlbnQ7XG4gICAgICAgICAgICAvLyBEaXNjb3VudCBhIHN3aXBlIGlmIGFkZGl0aW9uYWwgdG91Y2hlcyBhcmUgcHJlc2VudCBhZnRlclxuICAgICAgICAgICAgLy8gYSBzd2lwZSBoYXMgc3RhcnRlZC5cbiAgICAgICAgICAgIGlmIChpc1RvdWNoICYmIGV2ZW50LnRvdWNoZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIHN3aXBlIGhhcyBleGNlZWRlZCBkdXJhdGlvbiBzdG9wIHRyYWNraW5nXG4gICAgICAgICAgICBpZiAoZXZlbnQudGltZVN0YW1wIC0gc3RhdGUuc3RhcnQgPiBwcm9wcy5zd2lwZUR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlLnN3aXBpbmcgPyBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKSwgeyBzd2lwaW5nOiBmYWxzZSB9KSA6IHN0YXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBpc1RvdWNoID8gZXZlbnQudG91Y2hlc1swXSA6IGV2ZW50O1xuICAgICAgICAgICAgY29uc3QgW3gsIHldID0gcm90YXRlWFlCeUFuZ2xlKFtjbGllbnRYLCBjbGllbnRZXSwgcHJvcHMucm90YXRpb25BbmdsZSk7XG4gICAgICAgICAgICBjb25zdCBkZWx0YVggPSB4IC0gc3RhdGUueHlbMF07XG4gICAgICAgICAgICBjb25zdCBkZWx0YVkgPSB5IC0gc3RhdGUueHlbMV07XG4gICAgICAgICAgICBjb25zdCBhYnNYID0gTWF0aC5hYnMoZGVsdGFYKTtcbiAgICAgICAgICAgIGNvbnN0IGFic1kgPSBNYXRoLmFicyhkZWx0YVkpO1xuICAgICAgICAgICAgY29uc3QgdGltZSA9IChldmVudC50aW1lU3RhbXAgfHwgMCkgLSBzdGF0ZS5zdGFydDtcbiAgICAgICAgICAgIGNvbnN0IHZlbG9jaXR5ID0gTWF0aC5zcXJ0KGFic1ggKiBhYnNYICsgYWJzWSAqIGFic1kpIC8gKHRpbWUgfHwgMSk7XG4gICAgICAgICAgICBjb25zdCB2eHZ5ID0gW2RlbHRhWCAvICh0aW1lIHx8IDEpLCBkZWx0YVkgLyAodGltZSB8fCAxKV07XG4gICAgICAgICAgICBjb25zdCBkaXIgPSBnZXREaXJlY3Rpb24oYWJzWCwgYWJzWSwgZGVsdGFYLCBkZWx0YVkpO1xuICAgICAgICAgICAgLy8gaWYgc3dpcGUgaXMgdW5kZXIgZGVsdGEgYW5kIHdlIGhhdmUgbm90IHN0YXJ0ZWQgdG8gdHJhY2sgYSBzd2lwZTogc2tpcCB1cGRhdGVcbiAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gdHlwZW9mIHByb3BzLmRlbHRhID09PSBcIm51bWJlclwiXG4gICAgICAgICAgICAgICAgPyBwcm9wcy5kZWx0YVxuICAgICAgICAgICAgICAgIDogcHJvcHMuZGVsdGFbZGlyLnRvTG93ZXJDYXNlKCldIHx8XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRQcm9wcy5kZWx0YTtcbiAgICAgICAgICAgIGlmIChhYnNYIDwgZGVsdGEgJiYgYWJzWSA8IGRlbHRhICYmICFzdGF0ZS5zd2lwaW5nKVxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50RGF0YSA9IHtcbiAgICAgICAgICAgICAgICBhYnNYLFxuICAgICAgICAgICAgICAgIGFic1ksXG4gICAgICAgICAgICAgICAgZGVsdGFYLFxuICAgICAgICAgICAgICAgIGRlbHRhWSxcbiAgICAgICAgICAgICAgICBkaXIsXG4gICAgICAgICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgICAgICAgZmlyc3Q6IHN0YXRlLmZpcnN0LFxuICAgICAgICAgICAgICAgIGluaXRpYWw6IHN0YXRlLmluaXRpYWwsXG4gICAgICAgICAgICAgICAgdmVsb2NpdHksXG4gICAgICAgICAgICAgICAgdnh2eSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBjYWxsIG9uU3dpcGVTdGFydCBpZiBwcmVzZW50IGFuZCBpcyBmaXJzdCBzd2lwZSBldmVudFxuICAgICAgICAgICAgZXZlbnREYXRhLmZpcnN0ICYmIHByb3BzLm9uU3dpcGVTdGFydCAmJiBwcm9wcy5vblN3aXBlU3RhcnQoZXZlbnREYXRhKTtcbiAgICAgICAgICAgIC8vIGNhbGwgb25Td2lwaW5nIGlmIHByZXNlbnRcbiAgICAgICAgICAgIHByb3BzLm9uU3dpcGluZyAmJiBwcm9wcy5vblN3aXBpbmcoZXZlbnREYXRhKTtcbiAgICAgICAgICAgIC8vIHRyYWNrIGlmIGEgc3dpcGUgaXMgY2FuY2VsYWJsZSAoaGFuZGxlciBmb3Igc3dpcGluZyBvciBzd2lwZWQoZGlyKSBleGlzdHMpXG4gICAgICAgICAgICAvLyBzbyB3ZSBjYW4gY2FsbCBwcmV2ZW50RGVmYXVsdCBpZiBuZWVkZWRcbiAgICAgICAgICAgIGxldCBjYW5jZWxhYmxlUGFnZVN3aXBlID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAocHJvcHMub25Td2lwaW5nIHx8XG4gICAgICAgICAgICAgICAgcHJvcHMub25Td2lwZWQgfHxcbiAgICAgICAgICAgICAgICBwcm9wc1tgb25Td2lwZWQke2Rpcn1gXSkge1xuICAgICAgICAgICAgICAgIGNhbmNlbGFibGVQYWdlU3dpcGUgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNhbmNlbGFibGVQYWdlU3dpcGUgJiZcbiAgICAgICAgICAgICAgICBwcm9wcy5wcmV2ZW50U2Nyb2xsT25Td2lwZSAmJlxuICAgICAgICAgICAgICAgIHByb3BzLnRyYWNrVG91Y2ggJiZcbiAgICAgICAgICAgICAgICBldmVudC5jYW5jZWxhYmxlKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKSwgeyBcbiAgICAgICAgICAgICAgICAvLyBmaXJzdCBpcyBub3cgYWx3YXlzIGZhbHNlXG4gICAgICAgICAgICAgICAgZmlyc3Q6IGZhbHNlLCBldmVudERhdGEsIHN3aXBpbmc6IHRydWUgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3Qgb25FbmQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgc2V0KChzdGF0ZSwgcHJvcHMpID0+IHtcbiAgICAgICAgICAgIGxldCBldmVudERhdGE7XG4gICAgICAgICAgICBpZiAoc3RhdGUuc3dpcGluZyAmJiBzdGF0ZS5ldmVudERhdGEpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiBzd2lwZSBpcyBsZXNzIHRoYW4gZHVyYXRpb24gZmlyZSBzd2lwZWQgY2FsbGJhY2tzXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRpbWVTdGFtcCAtIHN0YXRlLnN0YXJ0IDwgcHJvcHMuc3dpcGVEdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBldmVudERhdGEgPSBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmV2ZW50RGF0YSksIHsgZXZlbnQgfSk7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzLm9uU3dpcGVkICYmIHByb3BzLm9uU3dpcGVkKGV2ZW50RGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9uU3dpcGVkRGlyID0gcHJvcHNbYG9uU3dpcGVkJHtldmVudERhdGEuZGlyfWBdO1xuICAgICAgICAgICAgICAgICAgICBvblN3aXBlZERpciAmJiBvblN3aXBlZERpcihldmVudERhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb3BzLm9uVGFwICYmIHByb3BzLm9uVGFwKHsgZXZlbnQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcm9wcy5vblRvdWNoRW5kT3JPbk1vdXNlVXAgJiYgcHJvcHMub25Ub3VjaEVuZE9yT25Nb3VzZVVwKHsgZXZlbnQgfSk7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKSwgaW5pdGlhbFN0YXRlKSwgeyBldmVudERhdGEgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgY29uc3QgY2xlYW5VcE1vdXNlID0gKCkgPT4ge1xuICAgICAgICAvLyBzYWZlIHRvIGp1c3QgY2FsbCByZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIobW91c2VNb3ZlLCBvbk1vdmUpO1xuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKG1vdXNlVXAsIG9uVXApO1xuICAgIH07XG4gICAgY29uc3Qgb25VcCA9IChlKSA9PiB7XG4gICAgICAgIGNsZWFuVXBNb3VzZSgpO1xuICAgICAgICBvbkVuZChlKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFRoZSB2YWx1ZSBvZiBwYXNzaXZlIG9uIHRvdWNoTW92ZSBkZXBlbmRzIG9uIGBwcmV2ZW50U2Nyb2xsT25Td2lwZWA6XG4gICAgICogLSB0cnVlID0+IHsgcGFzc2l2ZTogZmFsc2UgfVxuICAgICAqIC0gZmFsc2UgPT4geyBwYXNzaXZlOiB0cnVlIH0gLy8gRGVmYXVsdFxuICAgICAqXG4gICAgICogTk9URTogV2hlbiBwcmV2ZW50U2Nyb2xsT25Td2lwZSBpcyB0cnVlLCB3ZSBhdHRlbXB0IHRvIGNhbGwgcHJldmVudERlZmF1bHQgdG8gcHJldmVudCBzY3JvbGwuXG4gICAgICpcbiAgICAgKiBwcm9wcy50b3VjaEV2ZW50T3B0aW9ucyBjYW4gYWxzbyBiZSBzZXQgZm9yIGFsbCB0b3VjaCBldmVudCBsaXN0ZW5lcnMsXG4gICAgICogYnV0IGZvciBgdG91Y2htb3ZlYCBzcGVjaWZpY2FsbHkgd2hlbiBgcHJldmVudFNjcm9sbE9uU3dpcGVgIGl0IHdpbGxcbiAgICAgKiBzdXBlcnNlZGUgYW5kIGZvcmNlIHBhc3NpdmUgdG8gZmFsc2UuXG4gICAgICpcbiAgICAgKi9cbiAgICBjb25zdCBhdHRhY2hUb3VjaCA9IChlbCwgcHJvcHMpID0+IHtcbiAgICAgICAgbGV0IGNsZWFudXAgPSAoKSA9PiB7IH07XG4gICAgICAgIGlmIChlbCAmJiBlbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBjb25zdCBiYXNlT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdFByb3BzLnRvdWNoRXZlbnRPcHRpb25zKSwgcHJvcHMudG91Y2hFdmVudE9wdGlvbnMpO1xuICAgICAgICAgICAgLy8gYXR0YWNoIHRvdWNoIGV2ZW50IGxpc3RlbmVycyBhbmQgaGFuZGxlcnNcbiAgICAgICAgICAgIGNvbnN0IHRscyA9IFtcbiAgICAgICAgICAgICAgICBbdG91Y2hTdGFydCwgb25TdGFydCwgYmFzZU9wdGlvbnNdLFxuICAgICAgICAgICAgICAgIC8vIHByZXZlbnRTY3JvbGxPblN3aXBlIG9wdGlvbiBzdXBlcnNlZGVzIHRvdWNoRXZlbnRPcHRpb25zLnBhc3NpdmVcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIHRvdWNoTW92ZSxcbiAgICAgICAgICAgICAgICAgICAgb25Nb3ZlLFxuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIGJhc2VPcHRpb25zKSwgKHByb3BzLnByZXZlbnRTY3JvbGxPblN3aXBlID8geyBwYXNzaXZlOiBmYWxzZSB9IDoge30pKSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFt0b3VjaEVuZCwgb25FbmQsIGJhc2VPcHRpb25zXSxcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICB0bHMuZm9yRWFjaCgoW2UsIGgsIG9dKSA9PiBlbC5hZGRFdmVudExpc3RlbmVyKGUsIGgsIG8pKTtcbiAgICAgICAgICAgIC8vIHJldHVybiBwcm9wZXJseSBzY29wZWQgY2xlYW51cCBtZXRob2QgZm9yIHJlbW92aW5nIGxpc3RlbmVycywgb3B0aW9ucyBub3QgcmVxdWlyZWRcbiAgICAgICAgICAgIGNsZWFudXAgPSAoKSA9PiB0bHMuZm9yRWFjaCgoW2UsIGhdKSA9PiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKGUsIGgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2xlYW51cDtcbiAgICB9O1xuICAgIGNvbnN0IG9uUmVmID0gKGVsKSA9PiB7XG4gICAgICAgIC8vIFwiaW5saW5lXCIgcmVmIGZ1bmN0aW9ucyBhcmUgY2FsbGVkIHR3aWNlIG9uIHJlbmRlciwgb25jZSB3aXRoIG51bGwgdGhlbiBhZ2FpbiB3aXRoIERPTSBlbGVtZW50XG4gICAgICAgIC8vIGlnbm9yZSBudWxsIGhlcmVcbiAgICAgICAgaWYgKGVsID09PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBzZXQoKHN0YXRlLCBwcm9wcykgPT4ge1xuICAgICAgICAgICAgLy8gaWYgdGhlIHNhbWUgRE9NIGVsIGFzIHByZXZpb3VzIGp1c3QgcmV0dXJuIHN0YXRlXG4gICAgICAgICAgICBpZiAoc3RhdGUuZWwgPT09IGVsKVxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgICAgICAgIGNvbnN0IGFkZFN0YXRlID0ge307XG4gICAgICAgICAgICAvLyBpZiBuZXcgRE9NIGVsIGNsZWFuIHVwIG9sZCBET00gYW5kIHJlc2V0IGNsZWFuVXBUb3VjaFxuICAgICAgICAgICAgaWYgKHN0YXRlLmVsICYmIHN0YXRlLmVsICE9PSBlbCAmJiBzdGF0ZS5jbGVhblVwVG91Y2gpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5jbGVhblVwVG91Y2goKTtcbiAgICAgICAgICAgICAgICBhZGRTdGF0ZS5jbGVhblVwVG91Y2ggPSB2b2lkIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBvbmx5IGF0dGFjaCBpZiB3ZSB3YW50IHRvIHRyYWNrIHRvdWNoXG4gICAgICAgICAgICBpZiAocHJvcHMudHJhY2tUb3VjaCAmJiBlbCkge1xuICAgICAgICAgICAgICAgIGFkZFN0YXRlLmNsZWFuVXBUb3VjaCA9IGF0dGFjaFRvdWNoKGVsLCBwcm9wcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBzdG9yZSBldmVudCBhdHRhY2hlZCBET00gZWwgZm9yIGNvbXBhcmlzb24sIGNsZWFuIHVwLCBhbmQgcmUtYXR0YWNobWVudFxuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSksIHsgZWwgfSksIGFkZFN0YXRlKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAvLyBzZXQgcmVmIGNhbGxiYWNrIHRvIGF0dGFjaCB0b3VjaCBldmVudCBsaXN0ZW5lcnNcbiAgICBjb25zdCBvdXRwdXQgPSB7XG4gICAgICAgIHJlZjogb25SZWYsXG4gICAgfTtcbiAgICAvLyBpZiB0cmFjayBtb3VzZSBhdHRhY2ggbW91c2UgZG93biBsaXN0ZW5lclxuICAgIGlmIChoYW5kbGVyUHJvcHMudHJhY2tNb3VzZSkge1xuICAgICAgICBvdXRwdXQub25Nb3VzZURvd24gPSBvblN0YXJ0O1xuICAgIH1cbiAgICByZXR1cm4gW291dHB1dCwgYXR0YWNoVG91Y2hdO1xufVxuZnVuY3Rpb24gdXBkYXRlVHJhbnNpZW50U3RhdGUoc3RhdGUsIHByb3BzLCBwcmV2aW91c1Byb3BzLCBhdHRhY2hUb3VjaCkge1xuICAgIC8vIGlmIHRyYWNrVG91Y2ggaXMgb2ZmIG9yIHRoZXJlIGlzIG5vIGVsLCB0aGVuIHJlbW92ZSBoYW5kbGVycyBpZiBuZWNlc3NhcnkgYW5kIGV4aXRcbiAgICBpZiAoIXByb3BzLnRyYWNrVG91Y2ggfHwgIXN0YXRlLmVsKSB7XG4gICAgICAgIGlmIChzdGF0ZS5jbGVhblVwVG91Y2gpIHtcbiAgICAgICAgICAgIHN0YXRlLmNsZWFuVXBUb3VjaCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKSwgeyBjbGVhblVwVG91Y2g6IHVuZGVmaW5lZCB9KTtcbiAgICB9XG4gICAgLy8gdHJhY2tUb3VjaCBpcyBvbiwgc28gaWYgdGhlcmUgYXJlIG5vIGhhbmRsZXJzIGF0dGFjaGVkLCBhdHRhY2ggdGhlbSBhbmQgZXhpdFxuICAgIGlmICghc3RhdGUuY2xlYW5VcFRvdWNoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKSwgeyBjbGVhblVwVG91Y2g6IGF0dGFjaFRvdWNoKHN0YXRlLmVsLCBwcm9wcykgfSk7XG4gICAgfVxuICAgIC8vIHRyYWNrVG91Y2ggaXMgb24gYW5kIGhhbmRsZXJzIGFyZSBhbHJlYWR5IGF0dGFjaGVkLCBzbyBpZiBwcmV2ZW50U2Nyb2xsT25Td2lwZSBjaGFuZ2VzIHZhbHVlLFxuICAgIC8vIHJlbW92ZSBhbmQgcmVhdHRhY2ggaGFuZGxlcnMgKHRoaXMgaXMgcmVxdWlyZWQgdG8gdXBkYXRlIHRoZSBwYXNzaXZlIG9wdGlvbiB3aGVuIGF0dGFjaGluZ1xuICAgIC8vIHRoZSBoYW5kbGVycylcbiAgICBpZiAocHJvcHMucHJldmVudFNjcm9sbE9uU3dpcGUgIT09IHByZXZpb3VzUHJvcHMucHJldmVudFNjcm9sbE9uU3dpcGUgfHxcbiAgICAgICAgcHJvcHMudG91Y2hFdmVudE9wdGlvbnMucGFzc2l2ZSAhPT0gcHJldmlvdXNQcm9wcy50b3VjaEV2ZW50T3B0aW9ucy5wYXNzaXZlKSB7XG4gICAgICAgIHN0YXRlLmNsZWFuVXBUb3VjaCgpO1xuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSksIHsgY2xlYW5VcFRvdWNoOiBhdHRhY2hUb3VjaChzdGF0ZS5lbCwgcHJvcHMpIH0pO1xuICAgIH1cbiAgICByZXR1cm4gc3RhdGU7XG59XG5mdW5jdGlvbiB1c2VTd2lwZWFibGUob3B0aW9ucykge1xuICAgIGNvbnN0IHsgdHJhY2tNb3VzZSB9ID0gb3B0aW9ucztcbiAgICBjb25zdCB0cmFuc2llbnRTdGF0ZSA9IFJlYWN0LnVzZVJlZihPYmplY3QuYXNzaWduKHt9LCBpbml0aWFsU3RhdGUpKTtcbiAgICBjb25zdCB0cmFuc2llbnRQcm9wcyA9IFJlYWN0LnVzZVJlZihPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0UHJvcHMpKTtcbiAgICAvLyB0cmFjayBwcmV2aW91cyByZW5kZXJlZCBwcm9wc1xuICAgIGNvbnN0IHByZXZpb3VzUHJvcHMgPSBSZWFjdC51c2VSZWYoT2JqZWN0LmFzc2lnbih7fSwgdHJhbnNpZW50UHJvcHMuY3VycmVudCkpO1xuICAgIHByZXZpb3VzUHJvcHMuY3VycmVudCA9IE9iamVjdC5hc3NpZ24oe30sIHRyYW5zaWVudFByb3BzLmN1cnJlbnQpO1xuICAgIC8vIHVwZGF0ZSBjdXJyZW50IHJlbmRlciBwcm9wcyAmIGRlZmF1bHRzXG4gICAgdHJhbnNpZW50UHJvcHMuY3VycmVudCA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdFByb3BzKSwgb3B0aW9ucyk7XG4gICAgLy8gRm9yY2UgZGVmYXVsdHMgZm9yIGNvbmZpZyBwcm9wZXJ0aWVzXG4gICAgbGV0IGRlZmF1bHRLZXk7XG4gICAgZm9yIChkZWZhdWx0S2V5IGluIGRlZmF1bHRQcm9wcykge1xuICAgICAgICBpZiAodHJhbnNpZW50UHJvcHMuY3VycmVudFtkZWZhdWx0S2V5XSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICB0cmFuc2llbnRQcm9wcy5jdXJyZW50W2RlZmF1bHRLZXldID0gZGVmYXVsdFByb3BzW2RlZmF1bHRLZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IFtoYW5kbGVycywgYXR0YWNoVG91Y2hdID0gUmVhY3QudXNlTWVtbygoKSA9PiBnZXRIYW5kbGVycygoc3RhdGVTZXR0ZXIpID0+ICh0cmFuc2llbnRTdGF0ZS5jdXJyZW50ID0gc3RhdGVTZXR0ZXIodHJhbnNpZW50U3RhdGUuY3VycmVudCwgdHJhbnNpZW50UHJvcHMuY3VycmVudCkpLCB7IHRyYWNrTW91c2UgfSksIFt0cmFja01vdXNlXSk7XG4gICAgdHJhbnNpZW50U3RhdGUuY3VycmVudCA9IHVwZGF0ZVRyYW5zaWVudFN0YXRlKHRyYW5zaWVudFN0YXRlLmN1cnJlbnQsIHRyYW5zaWVudFByb3BzLmN1cnJlbnQsIHByZXZpb3VzUHJvcHMuY3VycmVudCwgYXR0YWNoVG91Y2gpO1xuICAgIHJldHVybiBoYW5kbGVycztcbn1cblxuZXhwb3J0cy5ET1dOID0gRE9XTjtcbmV4cG9ydHMuTEVGVCA9IExFRlQ7XG5leHBvcnRzLlJJR0hUID0gUklHSFQ7XG5leHBvcnRzLlVQID0gVVA7XG5leHBvcnRzLnVzZVN3aXBlYWJsZSA9IHVzZVN3aXBlYWJsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcFxuIiwiaW1wb3J0IHsgQ3VycmVudFVzZXJOYXYsIEJveH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSdcbmltcG9ydCB7IHVzZUN1cnJlbnRBZG1pbiB9IGZyb20gJ2FkbWluanMnXG5pbXBvcnQge3VzZVNlbGVjdG9yfSBmcm9tICdyZWFjdC1yZWR1eCdcbmltcG9ydCB7QXNsZWVwMTYsIEF3YWtlMTZ9IGZyb20gJ0BjYXJib24vaWNvbnMtcmVhY3QnXG5pbXBvcnQgc3R5bGVkIGZyb20gJ3N0eWxlZC1jb21wb25lbnRzJ1xubGV0IGN1cnJlbnRBZG1pblVzZXI7XG5sZXQgdG9nZ2xlcjtcbmNvbnN0IFRvcEJhciA9IChwcm9wcykgPT4ge1xuICBjb25zdCBbY3VycmVudEFkbWluLCBzZXRDdXJyZW50QWRtaW5dID0gdXNlQ3VycmVudEFkbWluKClcbiAgY29uc3QgeyB0b2dnbGVTaWRlYmFyIH0gPSBwcm9wc1xuICB0b2dnbGVyID0gdG9nZ2xlU2lkZWJhclxuICBjb25zdCBbc2Vzc2lvbiwgcGF0aHMsIHZlcnNpb25zXSA9IHVzZVNlbGVjdG9yKFxuICAgIChzdGF0ZSkgPT4gW1xuICAgICAgc3RhdGUuc2Vzc2lvbixcbiAgICAgIHN0YXRlLnBhdGhzLFxuICAgICAgc3RhdGUudmVyc2lvbnMsXG4gICAgXSxcbiAgKVxuICBjdXJyZW50QWRtaW5Vc2VyID0gY3VycmVudEFkbWluXG4gIHJldHVybiAoXG4gICAgPEJveFxuICAgIGJvcmRlcj0nMHB4J1xuICAgIGZsZXhcbiAgICBmbGV4RGlyZWN0aW9uPSdyb3ctcmV2ZXJzZSdcbiAgICBoZWlnaHQ9J25hdmJhckhlaWdodCdcbiAgICBjbGFzc05hbWU9J3RvcGJhcidcbiAgICA+XG4gICAgICA8Q3VycmVudFVzZXJOYXZcbiAgICAgICAgZHJvcEFjdGlvbnM9e1tcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpY29uOiAnTG9nb3V0JyxcbiAgICAgICAgICAgIGxhYmVsOiAnTG9nIG91dCcsXG4gICAgICAgICAgICBocmVmOiAnL2FkbWluL2xvZ291dCcsXG4gICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiBub1JlZkNoZWNrKCkgeyB9XG4gICAgICAgICAgfVxuICAgICAgICBdfVxuICAgICAgICBsaW5lQWN0aW9ucz17W1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGljb246ICdDb250aW51ZScsXG4gICAgICAgICAgICBsYWJlbDogJ1NpZGViYXInLFxuICAgICAgICAgICAgb25DbGljazogdG9nZ2xlU2lkZWJhcixcbiAgICAgICAgICAgIFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWNvbjogJ0hlbHAnLFxuICAgICAgICAgICAgbGFiZWw6ICdIZWxwJyxcbiAgICAgICAgICAgIGhyZWY6ICdodHRwczovL2Rpc2NvcmQuZ2cvRnJ4WEFCdEUnLFxuICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gbm9SZWZDaGVjaygpIHsgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXG4gICAgICAgIF19XG4gICAgICAgIG5hbWU9e2N1cnJlbnRBZG1pbi5uYW1lfVxuICAgICAgICB0aXRsZT17Y3VycmVudEFkbWluLnJvbGV9XG4gICAgICAvPlxuICAgIDwvQm94PlxuICApXG59XG5leHBvcnQgeyBjdXJyZW50QWRtaW5Vc2VyLCB0b2dnbGVyIH1cbmV4cG9ydCBkZWZhdWx0IFRvcEJhciIsImltcG9ydCB7IEJveCwgUGxhY2Vob2xkZXIsIEJhZGdlIH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSdcbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgc3R5bGVkIGZyb20gJ3N0eWxlZC1jb21wb25lbnRzJ1xuaW1wb3J0IHsgQXBpQ2xpZW50LCB1c2VOb3RpY2UgfSBmcm9tICdhZG1pbmpzJztcbmltcG9ydCB7IHVzZVN3aXBlYWJsZSB9IGZyb20gJ3JlYWN0LXN3aXBlYWJsZSdcbmltcG9ydCB7IHRvZ2dsZXIgfSBmcm9tICcuL25hdmJhcidcbmNvbnN0IGFwaSA9IG5ldyBBcGlDbGllbnQoKTtcblxuXG5jb25zdCBEYXNoYm9hcmQgPSAoKSA9PiB7XG4gIGNvbnN0IFt0ZXh0LCBzZXRUZXh0XSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3N1YnNjcmlwdGlvbiwgc2V0U3Vic2NyaXB0aW9uXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3N0YXQsIHNldFN0YXRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbbG9ncywgc2V0TG9nc10gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW3BpbmcsIHNldFBpbmddID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbdXNlciwgc2V0VXNlcl0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgY29uc3QgaGFuZGxlcnMgPSB1c2VTd2lwZWFibGUoe1xuICAgIG9uU3dpcGVkUmlnaHQ6ICgpID0+IHRvZ2dsZXIoKSxcbiAgICBzd2lwZUR1cmF0aW9uOiA1MDAsXG4gICAgcHJldmVudFNjcm9sbE9uU3dpcGU6IHRydWUsXG4gICAgdHJhY2tNb3VzZTogZmFsc2VcbiAgfSk7XG5cblxuICBjb25zdCBhZGROb3RpY2UgPSB1c2VOb3RpY2UoKTtcbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSAoZXZlbnQpID0+IHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gIH1cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBhcGkuZ2V0RGFzaGJvYXJkKCkudGhlbigocmVzKSA9PiB7XG4gICAgICBzZXRUZXh0KHJlcy5kYXRhLnRleHQpO1xuICAgICAgc2V0U3Vic2NyaXB0aW9uKHJlcy5kYXRhLnN1YnNjcmlwdGlvbl90eXBlLnN1YnNjcmlwdGlvbik7XG4gICAgICBzZXRTdGF0KHJlcy5kYXRhLnN0YXQuaXNBY3RpdmUpO1xuICAgICAgc2V0TG9ncyhyZXMuZGF0YS5sb2dzKTtcbiAgICAgIHNldFBpbmcocmVzLmRhdGEucGluZyk7XG4gICAgICBzZXRVc2VyKHJlcy5kYXRhLnVzZXIubmFtZSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGNvbnN0IENhcmQgPSBzdHlsZWQoQm94KWBcbiAgaGVpZ2h0OiAxMDAlO1xuICBgXG5cblxuICByZXR1cm4gKFxuICAgIDxkaXYgey4uLmhhbmRsZXJzfT5cbiAgICAgIDxCb3ggdmFyaWFudD1cIndoaXRlXCIgY2xhc3NOYW1lPSdoZWlnaHQnPlxuICAgICAgICA8Q2FyZCB2YXJpYW50PVwid2hpdGVcIiBjbGFzc05hbWU9XCJhbmdyeS1ncmlkXCI+XG4gICAgICAgICAgPGRpdiBpZD1cIml0ZW0tMFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjYXJkXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2FyZC1kZXRhaWxzXCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC10aXRsZVwiPlVzZXJuYW1lPC9wPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1ib2R5XCI+e3VzZXI/Lmxlbmd0aCA/IDxwcmU+e3VzZXJ9PC9wcmU+IDogPFBsYWNlaG9sZGVyIHN0eWxlPXt7IHdpZHRoOiAxMDAsIGhlaWdodDogMTQgfX0gLz59PC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cIml0ZW0tMVwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjYXJkXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2FyZC1kZXRhaWxzXCI+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC10aXRsZVwiPlN1YnNjcmlwdGlvbjwvcD5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtYm9keVwiPntzdWJzY3JpcHRpb24/Lmxlbmd0aCA/IDxwcmU+e3N1YnNjcmlwdGlvbn08L3ByZT4gOiA8UGxhY2Vob2xkZXIgc3R5bGU9e3sgd2lkdGg6IDEwMCwgaGVpZ2h0OiAxNCB9fSAvPn08L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiaXRlbS0yXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNhcmRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjYXJkLWRldGFpbHNcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXRpdGxlXCI+U3RhdHVzPC9wPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1ib2R5XCI+e3N0YXQgPT0gJ0FjdGl2ZScgPyA8cHJlPjxCYWRnZSB2YXJpYW50PVwic3VjY2Vzc1wiPkFjdGl2ZTwvQmFkZ2U+PC9wcmU+IDogPEJhZGdlIHZhcmlhbnQ9XCJkYW5nZXJcIj5PZmZsaW5lPC9CYWRnZT59PC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cIml0ZW0tM1wiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2NhcmQnPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNhcmQtZGV0YWlsc1wiPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtdGl0bGVcIj5Bbm5vdW5jZW1lbnRzPC9wPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1ib2R5XCI+e3Bpbmc/Lmxlbmd0aCA/IDxwcmU+PHA+e3BpbmdbMF0uYW5ub3VuY2VtZW50fSBhdCB7cGluZ1swXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXX08L3A+PHA+e3BpbmdbMV0uYW5ub3VuY2VtZW50fSBhdCB7cGluZ1sxXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXX08L3A+PHA+e3BpbmdbMl0uYW5ub3VuY2VtZW50fSBhdCB7cGluZ1syXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXX08L3A+PC9wcmU+IDogPEJhZGdlIHZhcmlhbnQ9XCJkYW5nZXJcIj5Ob3RoaW5nPC9CYWRnZT59PC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cIml0ZW0tNFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2NhcmQnPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNhcmQtZGV0YWlsc1wiPlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtdGl0bGVcIj5BbnRpIEV4cGxvaXQ8L3A+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSd0ZXh0LWJvZHknPkxvcmVtIGlwc3VtIHNpdCBkb2xvciBhbWV0IGxvcmVtIGlwc3VtPC9wPlxuICAgICAgICAgICAgICAgIHsvKiA8ZGl2IGNsYXNzTmFtZT1cInRleHQtYm9keVwiPntwaW5nPy5sZW5ndGg/IDxwcmU+PHA+e3BpbmdbMF0uYW5ub3VuY2VtZW50fSBhdCB7cGluZ1swXS5jcmVhdGVkQXR9PC9wPjxwPntwaW5nWzFdLmFubm91bmNlbWVudH0gYXQge3BpbmdbMV0uY3JlYXRlZEF0fTwvcD48cD57cGluZ1syXS5hbm5vdW5jZW1lbnR9IGF0IHtwaW5nWzJdLmNyZWF0ZWRBdH08L3A+PC9wcmU+IDogPEJhZGdlIHZhcmlhbnQ9XCJkYW5nZXJcIj5Ob3RoaW5nPC9CYWRnZT59PC9kaXY+ICovfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJpdGVtLTVcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdjYXJkIGRhaWx5Jz5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjYXJkLWRldGFpbHNcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXRpdGxlXCI+RGFpbHk8L3A+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWJvZHlcIj57bG9ncz8ubGVuZ3RoID8gPHByZT48cD57bG9nc1swXS5kZXNjcmlwdGlvbn0gYXQge2xvZ3NbMF0uY3JlYXRlZEF0LnNwbGl0KCdUJylbMF19PC9wPjxwPntsb2dzWzFdLmRlc2NyaXB0aW9ufSBhdCB7bG9nc1sxXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXX08L3A+PHA+e2xvZ3NbMl0uZGVzY3JpcHRpb259IGF0IHtsb2dzWzJdLmNyZWF0ZWRBdC5zcGxpdCgnVCcpWzBdfTwvcD48L3ByZT4gOiA8QmFkZ2UgdmFyaWFudD1cImRhbmdlclwiPk5vdGhpbmc8L0JhZGdlPn08L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9DYXJkPlxuXG5cbiAgICAgIDwvQm94PlxuICAgICAgPGZvb3RlciBjbGFzc05hbWU9J2Zvb3Rlci1jb250ZW50Jz5cbiAgICAgICAgPGRpdj5Bc3BlY3QgU3lzdGVtcyB8IEFsbCByaWdodHMgcmVzZXJ2ZWQuPC9kaXY+PC9mb290ZXI+XG4gICAgPC9kaXY+XG4gIClcbn1cbmV4cG9ydCBkZWZhdWx0IERhc2hib2FyZFxuIiwiQWRtaW5KUy5Vc2VyQ29tcG9uZW50cyA9IHt9XG5pbXBvcnQgQ29tcG9uZW50MCBmcm9tICcuLi9zcmMvY29tcG9uZW50cy9teS1kYXNoYm9hcmQtY29tcG9uZW50J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5Db21wb25lbnQwID0gQ29tcG9uZW50MFxuaW1wb3J0IFRvcEJhciBmcm9tICcuLi9zcmMvY29tcG9uZW50cy9uYXZiYXInXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLlRvcEJhciA9IFRvcEJhclxuaW1wb3J0IENvbXBvbmVudDEgZnJvbSAnLi4vc3JjL2NvbXBvbmVudHMvbXktZGFzaGJvYXJkLWNvbXBvbmVudCdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuQ29tcG9uZW50MSA9IENvbXBvbmVudDFcbmltcG9ydCBEYXNoYm9hcmQgZnJvbSAnLi4vc3JjL2NvbXBvbmVudHMvbXktZGFzaGJvYXJkLWNvbXBvbmVudCdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuRGFzaGJvYXJkID0gRGFzaGJvYXJkIl0sIm5hbWVzIjpbIlJlYWN0IiwicmVxdWlyZSQkMCIsInRvZ2dsZXIiLCJUb3BCYXIiLCJwcm9wcyIsIl91c2VDdXJyZW50QWRtaW4iLCJ1c2VDdXJyZW50QWRtaW4iLCJfdXNlQ3VycmVudEFkbWluMiIsIl9zbGljZWRUb0FycmF5IiwiY3VycmVudEFkbWluIiwic2V0Q3VycmVudEFkbWluIiwidG9nZ2xlU2lkZWJhciIsIl91c2VTZWxlY3RvciIsInVzZVNlbGVjdG9yIiwic3RhdGUiLCJzZXNzaW9uIiwicGF0aHMiLCJ2ZXJzaW9ucyIsIl91c2VTZWxlY3RvcjIiLCJjcmVhdGVFbGVtZW50IiwiQm94IiwiYm9yZGVyIiwiZmxleCIsImZsZXhEaXJlY3Rpb24iLCJoZWlnaHQiLCJjbGFzc05hbWUiLCJDdXJyZW50VXNlck5hdiIsImRyb3BBY3Rpb25zIiwiaWNvbiIsImxhYmVsIiwiaHJlZiIsIm9uQ2xpY2siLCJub1JlZkNoZWNrIiwibGluZUFjdGlvbnMiLCJuYW1lIiwidGl0bGUiLCJyb2xlIiwiYXBpIiwiQXBpQ2xpZW50IiwiRGFzaGJvYXJkIiwiX3VzZVN0YXRlIiwidXNlU3RhdGUiLCJfdXNlU3RhdGUyIiwidGV4dCIsInNldFRleHQiLCJfdXNlU3RhdGUzIiwiX3VzZVN0YXRlNCIsInN1YnNjcmlwdGlvbiIsInNldFN1YnNjcmlwdGlvbiIsIl91c2VTdGF0ZTUiLCJfdXNlU3RhdGU2Iiwic3RhdCIsInNldFN0YXQiLCJfdXNlU3RhdGU3IiwiX3VzZVN0YXRlOCIsImxvZ3MiLCJzZXRMb2dzIiwiX3VzZVN0YXRlOSIsIl91c2VTdGF0ZTEwIiwicGluZyIsInNldFBpbmciLCJfdXNlU3RhdGUxMSIsIl91c2VTdGF0ZTEyIiwidXNlciIsInNldFVzZXIiLCJoYW5kbGVycyIsInVzZVN3aXBlYWJsZSIsIm9uU3dpcGVkUmlnaHQiLCJzd2lwZUR1cmF0aW9uIiwicHJldmVudFNjcm9sbE9uU3dpcGUiLCJ0cmFja01vdXNlIiwidXNlTm90aWNlIiwidXNlRWZmZWN0IiwiZ2V0RGFzaGJvYXJkIiwidGhlbiIsInJlcyIsImRhdGEiLCJzdWJzY3JpcHRpb25fdHlwZSIsImlzQWN0aXZlIiwiQ2FyZCIsInN0eWxlZCIsIl90ZW1wbGF0ZU9iamVjdCIsIl90YWdnZWRUZW1wbGF0ZUxpdGVyYWwiLCJ2YXJpYW50IiwiaWQiLCJsZW5ndGgiLCJQbGFjZWhvbGRlciIsInN0eWxlIiwid2lkdGgiLCJCYWRnZSIsImFubm91bmNlbWVudCIsImNyZWF0ZWRBdCIsInNwbGl0IiwiZGVzY3JpcHRpb24iLCJBZG1pbkpTIiwiVXNlckNvbXBvbmVudHMiLCJDb21wb25lbnQwIiwiQ29tcG9uZW50MSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQUVBLE1BQU0sQ0FBQyxjQUFjLENB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
