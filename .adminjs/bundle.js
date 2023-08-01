(function (designSystem, React$2, styledComponents, adminjs, reactRedux) {
    'use strict';

    function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

    var React__default = /*#__PURE__*/_interopDefault(React$2);

    var lib = {};

    Object.defineProperty(lib, '__esModule', { value: true });

    var React$1 = React__default.default;

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

    let toggler;
    const TopBar = props => {
      const [currentAdmin, setCurrentAdmin] = adminjs.useCurrentAdmin();
      const {
        toggleSidebar
      } = props;
      toggler = toggleSidebar;
      reactRedux.useSelector(state => [state.session, state.paths, state.versions]);
      const filePath = `${currentAdmin.name}%2F${currentAdmin.role}.png`;
      return React.createElement(designSystem.Box, {
        border: '0px',
        flex: true,
        flexDirection: 'row-reverse',
        height: 'navbarHeight',
        style: currentAdmin.theme == 'dark' ? {
          backgroundColor: '#281A4F',
          color: 'white',
          border: '2px solid black'
        } : {
          backgroundColor: 'white',
          color: '#0d1318'
        }
      }, React.createElement(designSystem.CurrentUserNav, {
        dropActions: [{
          icon: 'LogOut',
          label: 'Log out',
          href: '/admin/logout',
          onClick: function noRefCheck() {}
        }],
        lineActions: [{
          icon: 'ArrowRight',
          label: 'Sidebar',
          onClick: toggleSidebar
        }, {
          icon: 'AlertCircle',
          label: 'Help',
          href: 'https://discord.gg/FrxXABtE',
          onClick: function noRefCheck() {}
        }],
        name: currentAdmin.name,
        title: currentAdmin.role,
        avatarUrl: `https://firebasestorage.googleapis.com/v0/b/dashboard-d7e5d.appspot.com/o/${filePath}?alt=media`
      }));
    };

    const api = new adminjs.ApiClient();
    const Dashboard = () => {
      const [currentAdmin, setCurrentAdmin] = adminjs.useCurrentAdmin();
      const [text, setText] = React$2.useState('');
      const [subscription, setSubscription] = React$2.useState('');
      const [stat, setStat] = React$2.useState('');
      const [logs, setLogs] = React$2.useState('');
      const [ping, setPing] = React$2.useState('');
      const [user, setUser] = React$2.useState('');
      const handlers = useSwipeable_1({
        onSwipedRight: () => toggler(),
        swipeDuration: 500,
        preventScrollOnSwipe: true,
        trackMouse: false
      });
      adminjs.useNotice();
      React$2.useEffect(() => {
        api.getDashboard().then(res => {
          setText(res.data.text);
          setSubscription(res.data.subscription_type.subscription);
          setStat(res.data.stat.isActive);
          setLogs(res.data.logs);
          setPing(res.data.ping);
          setUser(res.data.user.name);
        });
      });
      const Card = styledComponents.styled(designSystem.Box)`
  height: 100%;
  `;
      let today = new Date();
      let dd = today.getDate();
      let mm = today.getMonth() + 1;
      const yyyy = today.getFullYear();
      if (dd < 10) {
        dd = `0${dd}`;
      }
      if (mm < 10) {
        mm = `0${mm}`;
      }
      today = `${yyyy}-${mm}-${dd}`;
      return /*#__PURE__*/React__default.default.createElement("div", {
        ...handlers,
        style: {
          backgroundColor: '#1e1e1e'
        }
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        color: currentAdmin.theme == 'dark' ? '' : "white",
        className: 'height',
        style: currentAdmin.theme == 'dark' ? {
          backgroundColor: '#281A4F'
        } : {
          backgroundColor: 'white'
        }
      }, /*#__PURE__*/React__default.default.createElement(Card, {
        color: currentAdmin.theme == 'dark' ? '' : "white",
        style: currentAdmin.theme == 'dark' ? {
          marginLeft: '10px',
          paddingTop: '10px'
        } : {
          marginLeft: '10px',
          paddingTop: '10px'
        },
        className: "angry-grid"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        id: "item-0"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card",
        style: currentAdmin.theme == 'dark' ? {
          color: 'white'
        } : {
          color: '#0d1318'
        }
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card-details"
      }, /*#__PURE__*/React__default.default.createElement("p", {
        className: "text-title"
      }, "Username"), /*#__PURE__*/React__default.default.createElement("hr", {
        style: {
          width: '100%'
        }
      }), /*#__PURE__*/React__default.default.createElement("div", {
        className: "text-body"
      }, user?.length ? /*#__PURE__*/React__default.default.createElement("pre", null, user) : /*#__PURE__*/React__default.default.createElement(designSystem.Placeholder, {
        style: {
          width: 100,
          height: 14
        }
      }))))), /*#__PURE__*/React__default.default.createElement("div", {
        id: "item-1"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card",
        style: currentAdmin.theme == 'dark' ? {
          color: 'white'
        } : {
          color: '#0d1318'
        }
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card-details"
      }, /*#__PURE__*/React__default.default.createElement("p", {
        className: "text-title"
      }, "Subscription"), /*#__PURE__*/React__default.default.createElement("hr", {
        style: {
          width: '100%'
        }
      }), /*#__PURE__*/React__default.default.createElement("div", {
        className: "text-body"
      }, subscription?.length ? /*#__PURE__*/React__default.default.createElement("pre", null, subscription) : /*#__PURE__*/React__default.default.createElement(designSystem.Placeholder, {
        style: {
          width: 100,
          height: 14
        }
      }))))), /*#__PURE__*/React__default.default.createElement("div", {
        id: "item-2"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card",
        style: currentAdmin.theme == 'dark' ? {
          color: 'white'
        } : {
          color: '#0d1318'
        }
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card-details"
      }, /*#__PURE__*/React__default.default.createElement("p", {
        className: "text-title"
      }, "Status"), /*#__PURE__*/React__default.default.createElement("hr", {
        style: {
          width: '100%'
        }
      }), /*#__PURE__*/React__default.default.createElement("div", {
        className: "text-body"
      }, stat == 'Active' ? /*#__PURE__*/React__default.default.createElement("pre", null, /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
        variant: "success"
      }, "Active")) : /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
        variant: "danger"
      }, "Offline"))))), /*#__PURE__*/React__default.default.createElement("div", {
        id: "item-3"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: 'card daily',
        style: currentAdmin.theme == 'dark' ? {
          background: '#1e1e1e',
          color: 'white',
          border: '0px solid #c3c6ce'
        } : {
          background: '#f7f7f7',
          color: '#0d1318',
          border: '2px solid #c3c6ce'
        }
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card-details"
      }, /*#__PURE__*/React__default.default.createElement("p", {
        className: "text-title"
      }, "Announcements"), /*#__PURE__*/React__default.default.createElement("div", {
        className: "text-body"
      }, ping?.length ? /*#__PURE__*/React__default.default.createElement("pre", null, /*#__PURE__*/React__default.default.createElement("p", null, ping[0].announcement, " at ", ping[0].createdAt.split('T')[0]), /*#__PURE__*/React__default.default.createElement("p", null, ping[1].announcement, " at ", ping[1].createdAt.split('T')[0]), /*#__PURE__*/React__default.default.createElement("p", null, ping[2].announcement, " at ", ping[2].createdAt.split('T')[0])) : /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
        variant: "danger"
      }, "No Announcements"))))), /*#__PURE__*/React__default.default.createElement("div", {
        id: "item-5"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: 'card daily',
        style: currentAdmin.theme == 'dark' ? {
          background: '#1e1e1e',
          color: 'white',
          border: '0px solid #c3c6ce'
        } : {
          background: '#f7f7f7',
          color: '#0d1318',
          border: '2px solid #c3c6ce'
        }
      }, /*#__PURE__*/React__default.default.createElement("p", {
        className: "text-title",
        style: {
          textAlign: 'center'
        }
      }, "Daily"), /*#__PURE__*/React__default.default.createElement("div", {
        className: "card-details",
        style: {
          placeContent: 'normal',
          paddingTop: '10px'
        }
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "text-body"
      }, logs[0]?.createdAt.split('T')[0] == today ? /*#__PURE__*/React__default.default.createElement("pre", null, /*#__PURE__*/React__default.default.createElement("p", null, logs[0]?.createdAt.split('T')[0] == today ? logs[0]?.description : '', " ", logs[0]?.createdAt.split('T')[0] == today ? "at" : '', " ", logs[0]?.createdAt.split('T')[0] == today ? logs[0]?.createdAt.split('T')[0] : ''), /*#__PURE__*/React__default.default.createElement("p", null, logs[1]?.createdAt.split('T')[0] == today ? logs[1]?.description : '', " ", logs[1]?.createdAt.split("T")[0] == today ? "at" : "", " ", logs[1]?.createdAt.split('T')[0] == today ? logs[1]?.createdAt.split('T')[0] : ''), /*#__PURE__*/React__default.default.createElement("p", null, logs[2]?.createdAt.split('T')[0] == today ? logs[2]?.description : '', "  ", logs[2]?.createdAt.split("T")[0] == today ? "at" : "", " ", logs[2]?.createdAt.split('T')[0] == today ? logs[2]?.createdAt.split('T')[0] : '')) : /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
        variant: "danger"
      }, "No Logs"))))))), /*#__PURE__*/React__default.default.createElement("footer", {
        className: 'footer-content',
        style: currentAdmin.theme == 'dark' ? {
          backgroundColor: '#281A4F',
          color: 'white'
        } : {
          backgroundColor: 'white',
          color: '#0d1318'
        }
      }, /*#__PURE__*/React__default.default.createElement("div", null, "Aspect Systems | All rights reserved.")));
    };

    const h = new adminjs.ViewHelpers();
    const SidebarBranding = () => {
      const [currentAdmin, setCurrentAdmin] = adminjs.useCurrentAdmin();
      return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        flex: true,
        alignItems: "center",
        justifyContent: "center",
        py: "xl",
        style: currentAdmin.theme == 'dark' ? {
          backgroundColor: 'black'
        } : {
          backgroundColor: 'white'
        }
      }, /*#__PURE__*/React__default.default.createElement("a", {
        href: h.dashboardUrl()
      }, /*#__PURE__*/React__default.default.createElement("img", {
        src: '/asset/logotype.png',
        alt: 'Aspect | Instep'
      })));
    };

    const Edit = ({ property, record, onChange }) => {
        const { params } = record;
        const { custom } = property;
        const path = adminjs.flat.get(params, custom.filePathProperty);
        const key = adminjs.flat.get(params, custom.keyProperty);
        const file = adminjs.flat.get(params, custom.fileProperty);
        const [originalKey, setOriginalKey] = React$2.useState(key);
        const [filesToUpload, setFilesToUpload] = React$2.useState([]);
        React$2.useEffect(() => {
            // it means means that someone hit save and new file has been uploaded
            // in this case fliesToUpload should be cleared.
            // This happens when user turns off redirect after new/edit
            if ((typeof key === 'string' && key !== originalKey)
                || (typeof key !== 'string' && !originalKey)
                || (typeof key !== 'string' && Array.isArray(key) && key.length !== originalKey.length)) {
                setOriginalKey(key);
                setFilesToUpload([]);
            }
        }, [key, originalKey]);
        const onUpload = (files) => {
            setFilesToUpload(files);
            onChange(custom.fileProperty, files);
        };
        const handleRemove = () => {
            onChange(custom.fileProperty, null);
        };
        const handleMultiRemove = (singleKey) => {
            const index = (adminjs.flat.get(record.params, custom.keyProperty) || []).indexOf(singleKey);
            const filesToDelete = adminjs.flat.get(record.params, custom.filesToDeleteProperty) || [];
            if (path && path.length > 0) {
                const newPath = path.map((currentPath, i) => (i !== index ? currentPath : null));
                let newParams = adminjs.flat.set(record.params, custom.filesToDeleteProperty, [...filesToDelete, index]);
                newParams = adminjs.flat.set(newParams, custom.filePathProperty, newPath);
                onChange({
                    ...record,
                    params: newParams,
                });
            }
            else {
                // eslint-disable-next-line no-console
                console.log('You cannot remove file when there are no uploaded files yet');
            }
        };
        return (React__default.default.createElement(designSystem.FormGroup, null,
            React__default.default.createElement(designSystem.Label, null, property.label),
            React__default.default.createElement(designSystem.DropZone, { onChange: onUpload, multiple: custom.multiple, validate: {
                    mimeTypes: custom.mimeTypes,
                    maxSize: custom.maxSize,
                }, files: filesToUpload }),
            !custom.multiple && key && path && !filesToUpload.length && file !== null && (React__default.default.createElement(designSystem.DropZoneItem, { filename: key, src: path, onRemove: handleRemove })),
            custom.multiple && key && key.length && path ? (React__default.default.createElement(React__default.default.Fragment, null, key.map((singleKey, index) => {
                // when we remove items we set only path index to nulls.
                // key is still there. This is because
                // we have to maintain all the indexes. So here we simply filter out elements which
                // were removed and display only what was left
                const currentPath = path[index];
                return currentPath ? (React__default.default.createElement(designSystem.DropZoneItem, { key: singleKey, filename: singleKey, src: path[index], onRemove: () => handleMultiRemove(singleKey) })) : '';
            }))) : ''));
    };

    const AudioMimeTypes = [
        'audio/aac',
        'audio/midi',
        'audio/x-midi',
        'audio/mpeg',
        'audio/ogg',
        'application/ogg',
        'audio/opus',
        'audio/wav',
        'audio/webm',
        'audio/3gpp2',
    ];
    const ImageMimeTypes = [
        'image/bmp',
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/svg+xml',
        'image/vnd.microsoft.icon',
        'image/tiff',
        'image/webp',
    ];

    // eslint-disable-next-line import/no-extraneous-dependencies
    const SingleFile = (props) => {
        const { name, path, mimeType, width } = props;
        if (path && path.length) {
            if (mimeType && ImageMimeTypes.includes(mimeType)) {
                return (React__default.default.createElement("img", { src: path, style: { maxHeight: width, maxWidth: width }, alt: name }));
            }
            if (mimeType && AudioMimeTypes.includes(mimeType)) {
                return (React__default.default.createElement("audio", { controls: true, src: path },
                    "Your browser does not support the",
                    React__default.default.createElement("code", null, "audio"),
                    React__default.default.createElement("track", { kind: "captions" })));
            }
        }
        return (React__default.default.createElement(designSystem.Box, null,
            React__default.default.createElement(designSystem.Button, { as: "a", href: path, ml: "default", size: "sm", rounded: true, target: "_blank" },
                React__default.default.createElement(designSystem.Icon, { icon: "DocumentDownload", color: "white", mr: "default" }),
                name)));
    };
    const File = ({ width, record, property }) => {
        const { custom } = property;
        let path = adminjs.flat.get(record?.params, custom.filePathProperty);
        if (!path) {
            return null;
        }
        const name = adminjs.flat.get(record?.params, custom.fileNameProperty ? custom.fileNameProperty : custom.keyProperty);
        const mimeType = custom.mimeTypeProperty
            && adminjs.flat.get(record?.params, custom.mimeTypeProperty);
        if (!property.custom.multiple) {
            if (custom.opts && custom.opts.baseUrl) {
                path = `${custom.opts.baseUrl}/${name}`;
            }
            return (React__default.default.createElement(SingleFile, { path: path, name: name, width: width, mimeType: mimeType }));
        }
        if (custom.opts && custom.opts.baseUrl) {
            const baseUrl = custom.opts.baseUrl || '';
            path = path.map((singlePath, index) => `${baseUrl}/${name[index]}`);
        }
        return (React__default.default.createElement(React__default.default.Fragment, null, path.map((singlePath, index) => (React__default.default.createElement(SingleFile, { key: singlePath, path: singlePath, name: name[index], width: width, mimeType: mimeType[index] })))));
    };

    const List = (props) => (React__default.default.createElement(File, { width: 100, ...props }));

    const Show = (props) => {
        const { property } = props;
        return (React__default.default.createElement(designSystem.FormGroup, null,
            React__default.default.createElement(designSystem.Label, null, property.label),
            React__default.default.createElement(File, { width: "100%", ...props })));
    };

    AdminJS.UserComponents = {};
    AdminJS.UserComponents.Dashboard = Dashboard;
    AdminJS.UserComponents.TopBar = TopBar;
    AdminJS.UserComponents.SidebarBranding = SidebarBranding;
    AdminJS.UserComponents.UploadEditComponent = Edit;
    AdminJS.UserComponents.UploadListComponent = List;
    AdminJS.UserComponents.UploadShowComponent = Show;

})(AdminJSDesignSystem, React, styled, AdminJS, ReactRedux);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvcmVhY3Qtc3dpcGVhYmxlL2xpYi9pbmRleC5qcyIsIi4uL2Rpc3QvY29tcG9uZW50cy9uYXZiYXIuanMiLCIuLi9kaXN0L2NvbXBvbmVudHMvbXktZGFzaGJvYXJkLWNvbXBvbmVudC5qcyIsIi4uL2Rpc3QvY29tcG9uZW50cy9TaWRlYmFyQnJhbmRpbmcuanMiLCIuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkRWRpdENvbXBvbmVudC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvdHlwZXMvbWltZS10eXBlcy50eXBlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS9jb21wb25lbnRzL2ZpbGUuanMiLCIuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkTGlzdENvbXBvbmVudC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRTaG93Q29tcG9uZW50LmpzIiwiLmVudHJ5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxuY29uc3QgTEVGVCA9IFwiTGVmdFwiO1xuY29uc3QgUklHSFQgPSBcIlJpZ2h0XCI7XG5jb25zdCBVUCA9IFwiVXBcIjtcbmNvbnN0IERPV04gPSBcIkRvd25cIjtcblxuLyogZ2xvYmFsIGRvY3VtZW50ICovXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gICAgZGVsdGE6IDEwLFxuICAgIHByZXZlbnRTY3JvbGxPblN3aXBlOiBmYWxzZSxcbiAgICByb3RhdGlvbkFuZ2xlOiAwLFxuICAgIHRyYWNrTW91c2U6IGZhbHNlLFxuICAgIHRyYWNrVG91Y2g6IHRydWUsXG4gICAgc3dpcGVEdXJhdGlvbjogSW5maW5pdHksXG4gICAgdG91Y2hFdmVudE9wdGlvbnM6IHsgcGFzc2l2ZTogdHJ1ZSB9LFxufTtcbmNvbnN0IGluaXRpYWxTdGF0ZSA9IHtcbiAgICBmaXJzdDogdHJ1ZSxcbiAgICBpbml0aWFsOiBbMCwgMF0sXG4gICAgc3RhcnQ6IDAsXG4gICAgc3dpcGluZzogZmFsc2UsXG4gICAgeHk6IFswLCAwXSxcbn07XG5jb25zdCBtb3VzZU1vdmUgPSBcIm1vdXNlbW92ZVwiO1xuY29uc3QgbW91c2VVcCA9IFwibW91c2V1cFwiO1xuY29uc3QgdG91Y2hFbmQgPSBcInRvdWNoZW5kXCI7XG5jb25zdCB0b3VjaE1vdmUgPSBcInRvdWNobW92ZVwiO1xuY29uc3QgdG91Y2hTdGFydCA9IFwidG91Y2hzdGFydFwiO1xuZnVuY3Rpb24gZ2V0RGlyZWN0aW9uKGFic1gsIGFic1ksIGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgaWYgKGFic1ggPiBhYnNZKSB7XG4gICAgICAgIGlmIChkZWx0YVggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUklHSFQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIExFRlQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGRlbHRhWSA+IDApIHtcbiAgICAgICAgcmV0dXJuIERPV047XG4gICAgfVxuICAgIHJldHVybiBVUDtcbn1cbmZ1bmN0aW9uIHJvdGF0ZVhZQnlBbmdsZShwb3MsIGFuZ2xlKSB7XG4gICAgaWYgKGFuZ2xlID09PSAwKVxuICAgICAgICByZXR1cm4gcG9zO1xuICAgIGNvbnN0IGFuZ2xlSW5SYWRpYW5zID0gKE1hdGguUEkgLyAxODApICogYW5nbGU7XG4gICAgY29uc3QgeCA9IHBvc1swXSAqIE1hdGguY29zKGFuZ2xlSW5SYWRpYW5zKSArIHBvc1sxXSAqIE1hdGguc2luKGFuZ2xlSW5SYWRpYW5zKTtcbiAgICBjb25zdCB5ID0gcG9zWzFdICogTWF0aC5jb3MoYW5nbGVJblJhZGlhbnMpIC0gcG9zWzBdICogTWF0aC5zaW4oYW5nbGVJblJhZGlhbnMpO1xuICAgIHJldHVybiBbeCwgeV07XG59XG5mdW5jdGlvbiBnZXRIYW5kbGVycyhzZXQsIGhhbmRsZXJQcm9wcykge1xuICAgIGNvbnN0IG9uU3RhcnQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgaXNUb3VjaCA9IFwidG91Y2hlc1wiIGluIGV2ZW50O1xuICAgICAgICAvLyBpZiBtb3JlIHRoYW4gYSBzaW5nbGUgdG91Y2ggZG9uJ3QgdHJhY2ssIGZvciBub3cuLi5cbiAgICAgICAgaWYgKGlzVG91Y2ggJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPiAxKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBzZXQoKHN0YXRlLCBwcm9wcykgPT4ge1xuICAgICAgICAgICAgLy8gc2V0dXAgbW91c2UgbGlzdGVuZXJzIG9uIGRvY3VtZW50IHRvIHRyYWNrIHN3aXBlIHNpbmNlIHN3aXBlIGNhbiBsZWF2ZSBjb250YWluZXJcbiAgICAgICAgICAgIGlmIChwcm9wcy50cmFja01vdXNlICYmICFpc1RvdWNoKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihtb3VzZU1vdmUsIG9uTW92ZSk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihtb3VzZVVwLCBvblVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHsgY2xpZW50WCwgY2xpZW50WSB9ID0gaXNUb3VjaCA/IGV2ZW50LnRvdWNoZXNbMF0gOiBldmVudDtcbiAgICAgICAgICAgIGNvbnN0IHh5ID0gcm90YXRlWFlCeUFuZ2xlKFtjbGllbnRYLCBjbGllbnRZXSwgcHJvcHMucm90YXRpb25BbmdsZSk7XG4gICAgICAgICAgICBwcm9wcy5vblRvdWNoU3RhcnRPck9uTW91c2VEb3duICYmXG4gICAgICAgICAgICAgICAgcHJvcHMub25Ub3VjaFN0YXJ0T3JPbk1vdXNlRG93bih7IGV2ZW50IH0pO1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSksIGluaXRpYWxTdGF0ZSksIHsgaW5pdGlhbDogeHkuc2xpY2UoKSwgeHksIHN0YXJ0OiBldmVudC50aW1lU3RhbXAgfHwgMCB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBvbk1vdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgc2V0KChzdGF0ZSwgcHJvcHMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlzVG91Y2ggPSBcInRvdWNoZXNcIiBpbiBldmVudDtcbiAgICAgICAgICAgIC8vIERpc2NvdW50IGEgc3dpcGUgaWYgYWRkaXRpb25hbCB0b3VjaGVzIGFyZSBwcmVzZW50IGFmdGVyXG4gICAgICAgICAgICAvLyBhIHN3aXBlIGhhcyBzdGFydGVkLlxuICAgICAgICAgICAgaWYgKGlzVG91Y2ggJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgc3dpcGUgaGFzIGV4Y2VlZGVkIGR1cmF0aW9uIHN0b3AgdHJhY2tpbmdcbiAgICAgICAgICAgIGlmIChldmVudC50aW1lU3RhbXAgLSBzdGF0ZS5zdGFydCA+IHByb3BzLnN3aXBlRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUuc3dpcGluZyA/IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCB7IHN3aXBpbmc6IGZhbHNlIH0pIDogc3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGlzVG91Y2ggPyBldmVudC50b3VjaGVzWzBdIDogZXZlbnQ7XG4gICAgICAgICAgICBjb25zdCBbeCwgeV0gPSByb3RhdGVYWUJ5QW5nbGUoW2NsaWVudFgsIGNsaWVudFldLCBwcm9wcy5yb3RhdGlvbkFuZ2xlKTtcbiAgICAgICAgICAgIGNvbnN0IGRlbHRhWCA9IHggLSBzdGF0ZS54eVswXTtcbiAgICAgICAgICAgIGNvbnN0IGRlbHRhWSA9IHkgLSBzdGF0ZS54eVsxXTtcbiAgICAgICAgICAgIGNvbnN0IGFic1ggPSBNYXRoLmFicyhkZWx0YVgpO1xuICAgICAgICAgICAgY29uc3QgYWJzWSA9IE1hdGguYWJzKGRlbHRhWSk7XG4gICAgICAgICAgICBjb25zdCB0aW1lID0gKGV2ZW50LnRpbWVTdGFtcCB8fCAwKSAtIHN0YXRlLnN0YXJ0O1xuICAgICAgICAgICAgY29uc3QgdmVsb2NpdHkgPSBNYXRoLnNxcnQoYWJzWCAqIGFic1ggKyBhYnNZICogYWJzWSkgLyAodGltZSB8fCAxKTtcbiAgICAgICAgICAgIGNvbnN0IHZ4dnkgPSBbZGVsdGFYIC8gKHRpbWUgfHwgMSksIGRlbHRhWSAvICh0aW1lIHx8IDEpXTtcbiAgICAgICAgICAgIGNvbnN0IGRpciA9IGdldERpcmVjdGlvbihhYnNYLCBhYnNZLCBkZWx0YVgsIGRlbHRhWSk7XG4gICAgICAgICAgICAvLyBpZiBzd2lwZSBpcyB1bmRlciBkZWx0YSBhbmQgd2UgaGF2ZSBub3Qgc3RhcnRlZCB0byB0cmFjayBhIHN3aXBlOiBza2lwIHVwZGF0ZVxuICAgICAgICAgICAgY29uc3QgZGVsdGEgPSB0eXBlb2YgcHJvcHMuZGVsdGEgPT09IFwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICA/IHByb3BzLmRlbHRhXG4gICAgICAgICAgICAgICAgOiBwcm9wcy5kZWx0YVtkaXIudG9Mb3dlckNhc2UoKV0gfHxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFByb3BzLmRlbHRhO1xuICAgICAgICAgICAgaWYgKGFic1ggPCBkZWx0YSAmJiBhYnNZIDwgZGVsdGEgJiYgIXN0YXRlLnN3aXBpbmcpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICAgICAgY29uc3QgZXZlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIGFic1gsXG4gICAgICAgICAgICAgICAgYWJzWSxcbiAgICAgICAgICAgICAgICBkZWx0YVgsXG4gICAgICAgICAgICAgICAgZGVsdGFZLFxuICAgICAgICAgICAgICAgIGRpcixcbiAgICAgICAgICAgICAgICBldmVudCxcbiAgICAgICAgICAgICAgICBmaXJzdDogc3RhdGUuZmlyc3QsXG4gICAgICAgICAgICAgICAgaW5pdGlhbDogc3RhdGUuaW5pdGlhbCxcbiAgICAgICAgICAgICAgICB2ZWxvY2l0eSxcbiAgICAgICAgICAgICAgICB2eHZ5LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIGNhbGwgb25Td2lwZVN0YXJ0IGlmIHByZXNlbnQgYW5kIGlzIGZpcnN0IHN3aXBlIGV2ZW50XG4gICAgICAgICAgICBldmVudERhdGEuZmlyc3QgJiYgcHJvcHMub25Td2lwZVN0YXJ0ICYmIHByb3BzLm9uU3dpcGVTdGFydChldmVudERhdGEpO1xuICAgICAgICAgICAgLy8gY2FsbCBvblN3aXBpbmcgaWYgcHJlc2VudFxuICAgICAgICAgICAgcHJvcHMub25Td2lwaW5nICYmIHByb3BzLm9uU3dpcGluZyhldmVudERhdGEpO1xuICAgICAgICAgICAgLy8gdHJhY2sgaWYgYSBzd2lwZSBpcyBjYW5jZWxhYmxlIChoYW5kbGVyIGZvciBzd2lwaW5nIG9yIHN3aXBlZChkaXIpIGV4aXN0cylcbiAgICAgICAgICAgIC8vIHNvIHdlIGNhbiBjYWxsIHByZXZlbnREZWZhdWx0IGlmIG5lZWRlZFxuICAgICAgICAgICAgbGV0IGNhbmNlbGFibGVQYWdlU3dpcGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChwcm9wcy5vblN3aXBpbmcgfHxcbiAgICAgICAgICAgICAgICBwcm9wcy5vblN3aXBlZCB8fFxuICAgICAgICAgICAgICAgIHByb3BzW2BvblN3aXBlZCR7ZGlyfWBdKSB7XG4gICAgICAgICAgICAgICAgY2FuY2VsYWJsZVBhZ2VTd2lwZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2FuY2VsYWJsZVBhZ2VTd2lwZSAmJlxuICAgICAgICAgICAgICAgIHByb3BzLnByZXZlbnRTY3JvbGxPblN3aXBlICYmXG4gICAgICAgICAgICAgICAgcHJvcHMudHJhY2tUb3VjaCAmJlxuICAgICAgICAgICAgICAgIGV2ZW50LmNhbmNlbGFibGUpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCB7IFxuICAgICAgICAgICAgICAgIC8vIGZpcnN0IGlzIG5vdyBhbHdheXMgZmFsc2VcbiAgICAgICAgICAgICAgICBmaXJzdDogZmFsc2UsIGV2ZW50RGF0YSwgc3dpcGluZzogdHJ1ZSB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBvbkVuZCA9IChldmVudCkgPT4ge1xuICAgICAgICBzZXQoKHN0YXRlLCBwcm9wcykgPT4ge1xuICAgICAgICAgICAgbGV0IGV2ZW50RGF0YTtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5zd2lwaW5nICYmIHN0YXRlLmV2ZW50RGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHN3aXBlIGlzIGxlc3MgdGhhbiBkdXJhdGlvbiBmaXJlIHN3aXBlZCBjYWxsYmFja3NcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGltZVN0YW1wIC0gc3RhdGUuc3RhcnQgPCBwcm9wcy5zd2lwZUR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50RGF0YSA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuZXZlbnREYXRhKSwgeyBldmVudCB9KTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMub25Td2lwZWQgJiYgcHJvcHMub25Td2lwZWQoZXZlbnREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb25Td2lwZWREaXIgPSBwcm9wc1tgb25Td2lwZWQke2V2ZW50RGF0YS5kaXJ9YF07XG4gICAgICAgICAgICAgICAgICAgIG9uU3dpcGVkRGlyICYmIG9uU3dpcGVkRGlyKGV2ZW50RGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvcHMub25UYXAgJiYgcHJvcHMub25UYXAoeyBldmVudCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByb3BzLm9uVG91Y2hFbmRPck9uTW91c2VVcCAmJiBwcm9wcy5vblRvdWNoRW5kT3JPbk1vdXNlVXAoeyBldmVudCB9KTtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCBpbml0aWFsU3RhdGUpLCB7IGV2ZW50RGF0YSB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBjbGVhblVwTW91c2UgPSAoKSA9PiB7XG4gICAgICAgIC8vIHNhZmUgdG8ganVzdCBjYWxsIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihtb3VzZU1vdmUsIG9uTW92ZSk7XG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIobW91c2VVcCwgb25VcCk7XG4gICAgfTtcbiAgICBjb25zdCBvblVwID0gKGUpID0+IHtcbiAgICAgICAgY2xlYW5VcE1vdXNlKCk7XG4gICAgICAgIG9uRW5kKGUpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogVGhlIHZhbHVlIG9mIHBhc3NpdmUgb24gdG91Y2hNb3ZlIGRlcGVuZHMgb24gYHByZXZlbnRTY3JvbGxPblN3aXBlYDpcbiAgICAgKiAtIHRydWUgPT4geyBwYXNzaXZlOiBmYWxzZSB9XG4gICAgICogLSBmYWxzZSA9PiB7IHBhc3NpdmU6IHRydWUgfSAvLyBEZWZhdWx0XG4gICAgICpcbiAgICAgKiBOT1RFOiBXaGVuIHByZXZlbnRTY3JvbGxPblN3aXBlIGlzIHRydWUsIHdlIGF0dGVtcHQgdG8gY2FsbCBwcmV2ZW50RGVmYXVsdCB0byBwcmV2ZW50IHNjcm9sbC5cbiAgICAgKlxuICAgICAqIHByb3BzLnRvdWNoRXZlbnRPcHRpb25zIGNhbiBhbHNvIGJlIHNldCBmb3IgYWxsIHRvdWNoIGV2ZW50IGxpc3RlbmVycyxcbiAgICAgKiBidXQgZm9yIGB0b3VjaG1vdmVgIHNwZWNpZmljYWxseSB3aGVuIGBwcmV2ZW50U2Nyb2xsT25Td2lwZWAgaXQgd2lsbFxuICAgICAqIHN1cGVyc2VkZSBhbmQgZm9yY2UgcGFzc2l2ZSB0byBmYWxzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGNvbnN0IGF0dGFjaFRvdWNoID0gKGVsLCBwcm9wcykgPT4ge1xuICAgICAgICBsZXQgY2xlYW51cCA9ICgpID0+IHsgfTtcbiAgICAgICAgaWYgKGVsICYmIGVsLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGJhc2VPcHRpb25zID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0UHJvcHMudG91Y2hFdmVudE9wdGlvbnMpLCBwcm9wcy50b3VjaEV2ZW50T3B0aW9ucyk7XG4gICAgICAgICAgICAvLyBhdHRhY2ggdG91Y2ggZXZlbnQgbGlzdGVuZXJzIGFuZCBoYW5kbGVyc1xuICAgICAgICAgICAgY29uc3QgdGxzID0gW1xuICAgICAgICAgICAgICAgIFt0b3VjaFN0YXJ0LCBvblN0YXJ0LCBiYXNlT3B0aW9uc10sXG4gICAgICAgICAgICAgICAgLy8gcHJldmVudFNjcm9sbE9uU3dpcGUgb3B0aW9uIHN1cGVyc2VkZXMgdG91Y2hFdmVudE9wdGlvbnMucGFzc2l2ZVxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgdG91Y2hNb3ZlLFxuICAgICAgICAgICAgICAgICAgICBvbk1vdmUsXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgYmFzZU9wdGlvbnMpLCAocHJvcHMucHJldmVudFNjcm9sbE9uU3dpcGUgPyB7IHBhc3NpdmU6IGZhbHNlIH0gOiB7fSkpLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgW3RvdWNoRW5kLCBvbkVuZCwgYmFzZU9wdGlvbnNdLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHRscy5mb3JFYWNoKChbZSwgaCwgb10pID0+IGVsLmFkZEV2ZW50TGlzdGVuZXIoZSwgaCwgbykpO1xuICAgICAgICAgICAgLy8gcmV0dXJuIHByb3Blcmx5IHNjb3BlZCBjbGVhbnVwIG1ldGhvZCBmb3IgcmVtb3ZpbmcgbGlzdGVuZXJzLCBvcHRpb25zIG5vdCByZXF1aXJlZFxuICAgICAgICAgICAgY2xlYW51cCA9ICgpID0+IHRscy5mb3JFYWNoKChbZSwgaF0pID0+IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZSwgaCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbGVhbnVwO1xuICAgIH07XG4gICAgY29uc3Qgb25SZWYgPSAoZWwpID0+IHtcbiAgICAgICAgLy8gXCJpbmxpbmVcIiByZWYgZnVuY3Rpb25zIGFyZSBjYWxsZWQgdHdpY2Ugb24gcmVuZGVyLCBvbmNlIHdpdGggbnVsbCB0aGVuIGFnYWluIHdpdGggRE9NIGVsZW1lbnRcbiAgICAgICAgLy8gaWdub3JlIG51bGwgaGVyZVxuICAgICAgICBpZiAoZWwgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHNldCgoc3RhdGUsIHByb3BzKSA9PiB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgc2FtZSBET00gZWwgYXMgcHJldmlvdXMganVzdCByZXR1cm4gc3RhdGVcbiAgICAgICAgICAgIGlmIChzdGF0ZS5lbCA9PT0gZWwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICAgICAgY29uc3QgYWRkU3RhdGUgPSB7fTtcbiAgICAgICAgICAgIC8vIGlmIG5ldyBET00gZWwgY2xlYW4gdXAgb2xkIERPTSBhbmQgcmVzZXQgY2xlYW5VcFRvdWNoXG4gICAgICAgICAgICBpZiAoc3RhdGUuZWwgJiYgc3RhdGUuZWwgIT09IGVsICYmIHN0YXRlLmNsZWFuVXBUb3VjaCkge1xuICAgICAgICAgICAgICAgIHN0YXRlLmNsZWFuVXBUb3VjaCgpO1xuICAgICAgICAgICAgICAgIGFkZFN0YXRlLmNsZWFuVXBUb3VjaCA9IHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIG9ubHkgYXR0YWNoIGlmIHdlIHdhbnQgdG8gdHJhY2sgdG91Y2hcbiAgICAgICAgICAgIGlmIChwcm9wcy50cmFja1RvdWNoICYmIGVsKSB7XG4gICAgICAgICAgICAgICAgYWRkU3RhdGUuY2xlYW5VcFRvdWNoID0gYXR0YWNoVG91Y2goZWwsIHByb3BzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHN0b3JlIGV2ZW50IGF0dGFjaGVkIERPTSBlbCBmb3IgY29tcGFyaXNvbiwgY2xlYW4gdXAsIGFuZCByZS1hdHRhY2htZW50XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKSwgeyBlbCB9KSwgYWRkU3RhdGUpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIC8vIHNldCByZWYgY2FsbGJhY2sgdG8gYXR0YWNoIHRvdWNoIGV2ZW50IGxpc3RlbmVyc1xuICAgIGNvbnN0IG91dHB1dCA9IHtcbiAgICAgICAgcmVmOiBvblJlZixcbiAgICB9O1xuICAgIC8vIGlmIHRyYWNrIG1vdXNlIGF0dGFjaCBtb3VzZSBkb3duIGxpc3RlbmVyXG4gICAgaWYgKGhhbmRsZXJQcm9wcy50cmFja01vdXNlKSB7XG4gICAgICAgIG91dHB1dC5vbk1vdXNlRG93biA9IG9uU3RhcnQ7XG4gICAgfVxuICAgIHJldHVybiBbb3V0cHV0LCBhdHRhY2hUb3VjaF07XG59XG5mdW5jdGlvbiB1cGRhdGVUcmFuc2llbnRTdGF0ZShzdGF0ZSwgcHJvcHMsIHByZXZpb3VzUHJvcHMsIGF0dGFjaFRvdWNoKSB7XG4gICAgLy8gaWYgdHJhY2tUb3VjaCBpcyBvZmYgb3IgdGhlcmUgaXMgbm8gZWwsIHRoZW4gcmVtb3ZlIGhhbmRsZXJzIGlmIG5lY2Vzc2FyeSBhbmQgZXhpdFxuICAgIGlmICghcHJvcHMudHJhY2tUb3VjaCB8fCAhc3RhdGUuZWwpIHtcbiAgICAgICAgaWYgKHN0YXRlLmNsZWFuVXBUb3VjaCkge1xuICAgICAgICAgICAgc3RhdGUuY2xlYW5VcFRvdWNoKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCB7IGNsZWFuVXBUb3VjaDogdW5kZWZpbmVkIH0pO1xuICAgIH1cbiAgICAvLyB0cmFja1RvdWNoIGlzIG9uLCBzbyBpZiB0aGVyZSBhcmUgbm8gaGFuZGxlcnMgYXR0YWNoZWQsIGF0dGFjaCB0aGVtIGFuZCBleGl0XG4gICAgaWYgKCFzdGF0ZS5jbGVhblVwVG91Y2gpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCB7IGNsZWFuVXBUb3VjaDogYXR0YWNoVG91Y2goc3RhdGUuZWwsIHByb3BzKSB9KTtcbiAgICB9XG4gICAgLy8gdHJhY2tUb3VjaCBpcyBvbiBhbmQgaGFuZGxlcnMgYXJlIGFscmVhZHkgYXR0YWNoZWQsIHNvIGlmIHByZXZlbnRTY3JvbGxPblN3aXBlIGNoYW5nZXMgdmFsdWUsXG4gICAgLy8gcmVtb3ZlIGFuZCByZWF0dGFjaCBoYW5kbGVycyAodGhpcyBpcyByZXF1aXJlZCB0byB1cGRhdGUgdGhlIHBhc3NpdmUgb3B0aW9uIHdoZW4gYXR0YWNoaW5nXG4gICAgLy8gdGhlIGhhbmRsZXJzKVxuICAgIGlmIChwcm9wcy5wcmV2ZW50U2Nyb2xsT25Td2lwZSAhPT0gcHJldmlvdXNQcm9wcy5wcmV2ZW50U2Nyb2xsT25Td2lwZSB8fFxuICAgICAgICBwcm9wcy50b3VjaEV2ZW50T3B0aW9ucy5wYXNzaXZlICE9PSBwcmV2aW91c1Byb3BzLnRvdWNoRXZlbnRPcHRpb25zLnBhc3NpdmUpIHtcbiAgICAgICAgc3RhdGUuY2xlYW5VcFRvdWNoKCk7XG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKSwgeyBjbGVhblVwVG91Y2g6IGF0dGFjaFRvdWNoKHN0YXRlLmVsLCBwcm9wcykgfSk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZTtcbn1cbmZ1bmN0aW9uIHVzZVN3aXBlYWJsZShvcHRpb25zKSB7XG4gICAgY29uc3QgeyB0cmFja01vdXNlIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IHRyYW5zaWVudFN0YXRlID0gUmVhY3QudXNlUmVmKE9iamVjdC5hc3NpZ24oe30sIGluaXRpYWxTdGF0ZSkpO1xuICAgIGNvbnN0IHRyYW5zaWVudFByb3BzID0gUmVhY3QudXNlUmVmKE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRQcm9wcykpO1xuICAgIC8vIHRyYWNrIHByZXZpb3VzIHJlbmRlcmVkIHByb3BzXG4gICAgY29uc3QgcHJldmlvdXNQcm9wcyA9IFJlYWN0LnVzZVJlZihPYmplY3QuYXNzaWduKHt9LCB0cmFuc2llbnRQcm9wcy5jdXJyZW50KSk7XG4gICAgcHJldmlvdXNQcm9wcy5jdXJyZW50ID0gT2JqZWN0LmFzc2lnbih7fSwgdHJhbnNpZW50UHJvcHMuY3VycmVudCk7XG4gICAgLy8gdXBkYXRlIGN1cnJlbnQgcmVuZGVyIHByb3BzICYgZGVmYXVsdHNcbiAgICB0cmFuc2llbnRQcm9wcy5jdXJyZW50ID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0UHJvcHMpLCBvcHRpb25zKTtcbiAgICAvLyBGb3JjZSBkZWZhdWx0cyBmb3IgY29uZmlnIHByb3BlcnRpZXNcbiAgICBsZXQgZGVmYXVsdEtleTtcbiAgICBmb3IgKGRlZmF1bHRLZXkgaW4gZGVmYXVsdFByb3BzKSB7XG4gICAgICAgIGlmICh0cmFuc2llbnRQcm9wcy5jdXJyZW50W2RlZmF1bHRLZXldID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgIHRyYW5zaWVudFByb3BzLmN1cnJlbnRbZGVmYXVsdEtleV0gPSBkZWZhdWx0UHJvcHNbZGVmYXVsdEtleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgW2hhbmRsZXJzLCBhdHRhY2hUb3VjaF0gPSBSZWFjdC51c2VNZW1vKCgpID0+IGdldEhhbmRsZXJzKChzdGF0ZVNldHRlcikgPT4gKHRyYW5zaWVudFN0YXRlLmN1cnJlbnQgPSBzdGF0ZVNldHRlcih0cmFuc2llbnRTdGF0ZS5jdXJyZW50LCB0cmFuc2llbnRQcm9wcy5jdXJyZW50KSksIHsgdHJhY2tNb3VzZSB9KSwgW3RyYWNrTW91c2VdKTtcbiAgICB0cmFuc2llbnRTdGF0ZS5jdXJyZW50ID0gdXBkYXRlVHJhbnNpZW50U3RhdGUodHJhbnNpZW50U3RhdGUuY3VycmVudCwgdHJhbnNpZW50UHJvcHMuY3VycmVudCwgcHJldmlvdXNQcm9wcy5jdXJyZW50LCBhdHRhY2hUb3VjaCk7XG4gICAgcmV0dXJuIGhhbmRsZXJzO1xufVxuXG5leHBvcnRzLkRPV04gPSBET1dOO1xuZXhwb3J0cy5MRUZUID0gTEVGVDtcbmV4cG9ydHMuUklHSFQgPSBSSUdIVDtcbmV4cG9ydHMuVVAgPSBVUDtcbmV4cG9ydHMudXNlU3dpcGVhYmxlID0gdXNlU3dpcGVhYmxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwXG4iLCJpbXBvcnQgeyBDdXJyZW50VXNlck5hdiwgQm94IH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5pbXBvcnQgeyB1c2VDdXJyZW50QWRtaW4gfSBmcm9tICdhZG1pbmpzJztcbmltcG9ydCB7IHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xubGV0IGN1cnJlbnRBZG1pblVzZXI7XG5sZXQgdG9nZ2xlcjtcbmNvbnN0IFRvcEJhciA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IFtjdXJyZW50QWRtaW4sIHNldEN1cnJlbnRBZG1pbl0gPSB1c2VDdXJyZW50QWRtaW4oKTtcbiAgICBjb25zdCB7IHRvZ2dsZVNpZGViYXIgfSA9IHByb3BzO1xuICAgIHRvZ2dsZXIgPSB0b2dnbGVTaWRlYmFyO1xuICAgIGNvbnN0IFtzZXNzaW9uLCBwYXRocywgdmVyc2lvbnNdID0gdXNlU2VsZWN0b3IoKHN0YXRlKSA9PiBbXG4gICAgICAgIHN0YXRlLnNlc3Npb24sXG4gICAgICAgIHN0YXRlLnBhdGhzLFxuICAgICAgICBzdGF0ZS52ZXJzaW9ucyxcbiAgICBdKTtcbiAgICBjb25zdCBmaWxlUGF0aCA9IGAke2N1cnJlbnRBZG1pbi5uYW1lfSUyRiR7Y3VycmVudEFkbWluLnJvbGV9LnBuZ2A7XG4gICAgY3VycmVudEFkbWluVXNlciA9IGN1cnJlbnRBZG1pbjtcbiAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoQm94LCB7IGJvcmRlcjogJzBweCcsIGZsZXg6IHRydWUsIGZsZXhEaXJlY3Rpb246ICdyb3ctcmV2ZXJzZScsIGhlaWdodDogJ25hdmJhckhlaWdodCcsIHN0eWxlOiBjdXJyZW50QWRtaW4udGhlbWUgPT0gJ2RhcmsnID8geyBiYWNrZ3JvdW5kQ29sb3I6ICcjMjgxQTRGJywgY29sb3I6ICd3aGl0ZScsIGJvcmRlcjogJzJweCBzb2xpZCBibGFjaycgfSA6IHsgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnLCBjb2xvcjogJyMwZDEzMTgnIH0gfSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChDdXJyZW50VXNlck5hdiwgeyBkcm9wQWN0aW9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWNvbjogJ0xvZ091dCcsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTG9nIG91dCcsXG4gICAgICAgICAgICAgICAgICAgIGhyZWY6ICcvYWRtaW4vbG9nb3V0JyxcbiAgICAgICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gbm9SZWZDaGVjaygpIHsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sIGxpbmVBY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpY29uOiAnQXJyb3dSaWdodCcsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnU2lkZWJhcicsXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IHRvZ2dsZVNpZGViYXIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGljb246ICdBbGVydENpcmNsZScsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnSGVscCcsXG4gICAgICAgICAgICAgICAgICAgIGhyZWY6ICdodHRwczovL2Rpc2NvcmQuZ2cvRnJ4WEFCdEUnLFxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiBub1JlZkNoZWNrKCkgeyB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sIG5hbWU6IGN1cnJlbnRBZG1pbi5uYW1lLCB0aXRsZTogY3VycmVudEFkbWluLnJvbGUsIGF2YXRhclVybDogYGh0dHBzOi8vZmlyZWJhc2VzdG9yYWdlLmdvb2dsZWFwaXMuY29tL3YwL2IvZGFzaGJvYXJkLWQ3ZTVkLmFwcHNwb3QuY29tL28vJHtmaWxlUGF0aH0/YWx0PW1lZGlhYCB9KSkpO1xufTtcbmV4cG9ydCB7IGN1cnJlbnRBZG1pblVzZXIsIHRvZ2dsZXIgfTtcbmV4cG9ydCBkZWZhdWx0IFRvcEJhcjtcbiIsImltcG9ydCB7IEJveCwgUGxhY2Vob2xkZXIsIEJhZGdlIH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHN0eWxlZCB9IGZyb20gJ0BhZG1pbmpzL2Rlc2lnbi1zeXN0ZW0vc3R5bGVkLWNvbXBvbmVudHMnO1xuaW1wb3J0IHsgQXBpQ2xpZW50LCB1c2VDdXJyZW50QWRtaW4sIHVzZU5vdGljZSB9IGZyb20gJ2FkbWluanMnO1xuaW1wb3J0IHsgdXNlU3dpcGVhYmxlIH0gZnJvbSAncmVhY3Qtc3dpcGVhYmxlJztcbmltcG9ydCB7IHRvZ2dsZXIgfSBmcm9tICcuL25hdmJhcic7XG5jb25zdCBhcGkgPSBuZXcgQXBpQ2xpZW50KCk7XG5jb25zdCBEYXNoYm9hcmQgPSAoKSA9PiB7XG4gICAgY29uc3QgW2N1cnJlbnRBZG1pbiwgc2V0Q3VycmVudEFkbWluXSA9IHVzZUN1cnJlbnRBZG1pbigpO1xuICAgIGNvbnN0IFt0ZXh0LCBzZXRUZXh0XSA9IHVzZVN0YXRlKCcnKTtcbiAgICBjb25zdCBbc3Vic2NyaXB0aW9uLCBzZXRTdWJzY3JpcHRpb25dID0gdXNlU3RhdGUoJycpO1xuICAgIGNvbnN0IFtzdGF0LCBzZXRTdGF0XSA9IHVzZVN0YXRlKCcnKTtcbiAgICBjb25zdCBbbG9ncywgc2V0TG9nc10gPSB1c2VTdGF0ZSgnJyk7XG4gICAgY29uc3QgW3BpbmcsIHNldFBpbmddID0gdXNlU3RhdGUoJycpO1xuICAgIGNvbnN0IFt1c2VyLCBzZXRVc2VyXSA9IHVzZVN0YXRlKCcnKTtcbiAgICBjb25zdCBoYW5kbGVycyA9IHVzZVN3aXBlYWJsZSh7XG4gICAgICAgIG9uU3dpcGVkUmlnaHQ6ICgpID0+IHRvZ2dsZXIoKSxcbiAgICAgICAgc3dpcGVEdXJhdGlvbjogNTAwLFxuICAgICAgICBwcmV2ZW50U2Nyb2xsT25Td2lwZTogdHJ1ZSxcbiAgICAgICAgdHJhY2tNb3VzZTogZmFsc2VcbiAgICB9KTtcbiAgICBjb25zdCBhZGROb3RpY2UgPSB1c2VOb3RpY2UoKTtcbiAgICBjb25zdCBoYW5kbGVDbGljayA9IChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH07XG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgYXBpLmdldERhc2hib2FyZCgpLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgc2V0VGV4dChyZXMuZGF0YS50ZXh0KTtcbiAgICAgICAgICAgIHNldFN1YnNjcmlwdGlvbihyZXMuZGF0YS5zdWJzY3JpcHRpb25fdHlwZS5zdWJzY3JpcHRpb24pO1xuICAgICAgICAgICAgc2V0U3RhdChyZXMuZGF0YS5zdGF0LmlzQWN0aXZlKTtcbiAgICAgICAgICAgIHNldExvZ3MocmVzLmRhdGEubG9ncyk7XG4gICAgICAgICAgICBzZXRQaW5nKHJlcy5kYXRhLnBpbmcpO1xuICAgICAgICAgICAgc2V0VXNlcihyZXMuZGF0YS51c2VyLm5hbWUpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBjb25zdCBDYXJkID0gc3R5bGVkKEJveCkgYFxuICBoZWlnaHQ6IDEwMCU7XG4gIGA7XG4gICAgbGV0IHRvZGF5ID0gbmV3IERhdGUoKTtcbiAgICBsZXQgZGQgPSB0b2RheS5nZXREYXRlKCk7XG4gICAgbGV0IG1tID0gdG9kYXkuZ2V0TW9udGgoKSArIDE7XG4gICAgY29uc3QgeXl5eSA9IHRvZGF5LmdldEZ1bGxZZWFyKCk7XG4gICAgaWYgKGRkIDwgMTApIHtcbiAgICAgICAgZGQgPSBgMCR7ZGR9YDtcbiAgICB9XG4gICAgaWYgKG1tIDwgMTApIHtcbiAgICAgICAgbW0gPSBgMCR7bW19YDtcbiAgICB9XG4gICAgdG9kYXkgPSBgJHt5eXl5fS0ke21tfS0ke2RkfWA7XG4gICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgLi4uaGFuZGxlcnMsIHN0eWxlOiB7IGJhY2tncm91bmRDb2xvcjogJyMxZTFlMWUnIH0gfSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCb3gsIHsgY29sb3I6IGN1cnJlbnRBZG1pbi50aGVtZSA9PSAnZGFyaycgPyAnJyA6IFwid2hpdGVcIiwgY2xhc3NOYW1lOiAnaGVpZ2h0Jywgc3R5bGU6IGN1cnJlbnRBZG1pbi50aGVtZSA9PSAnZGFyaycgPyB7IGJhY2tncm91bmRDb2xvcjogJyMyODFBNEYnIH0gOiB7IGJhY2tncm91bmRDb2xvcjogJ3doaXRlJyB9IH0sXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KENhcmQsIHsgY29sb3I6IGN1cnJlbnRBZG1pbi50aGVtZSA9PSAnZGFyaycgPyAnJyA6IFwid2hpdGVcIiwgc3R5bGU6IGN1cnJlbnRBZG1pbi50aGVtZSA9PSAnZGFyaycgPyB7IG1hcmdpbkxlZnQ6ICcxMHB4JywgcGFkZGluZ1RvcDogJzEwcHgnIH0gOiB7IG1hcmdpbkxlZnQ6ICcxMHB4JywgcGFkZGluZ1RvcDogJzEwcHgnIH0sIGNsYXNzTmFtZTogXCJhbmdyeS1ncmlkXCIgfSxcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgaWQ6IFwiaXRlbS0wXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJjYXJkXCIsIHN0eWxlOiBjdXJyZW50QWRtaW4udGhlbWUgPT0gJ2RhcmsnID8geyBjb2xvcjogJ3doaXRlJywgfSA6IHsgY29sb3I6ICcjMGQxMzE4JyB9IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmQtZGV0YWlsc1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgeyBjbGFzc05hbWU6IFwidGV4dC10aXRsZVwiIH0sIFwiVXNlcm5hbWVcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImhyXCIsIHsgc3R5bGU6IHsgd2lkdGg6ICcxMDAlJyB9IH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwidGV4dC1ib2R5XCIgfSwgdXNlcj8ubGVuZ3RoID8gUmVhY3QuY3JlYXRlRWxlbWVudChcInByZVwiLCBudWxsLCB1c2VyKSA6IFJlYWN0LmNyZWF0ZUVsZW1lbnQoUGxhY2Vob2xkZXIsIHsgc3R5bGU6IHsgd2lkdGg6IDEwMCwgaGVpZ2h0OiAxNCB9IH0pKSkpKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgaWQ6IFwiaXRlbS0xXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJjYXJkXCIsIHN0eWxlOiBjdXJyZW50QWRtaW4udGhlbWUgPT0gJ2RhcmsnID8geyBjb2xvcjogJ3doaXRlJywgfSA6IHsgY29sb3I6ICcjMGQxMzE4JyB9IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmQtZGV0YWlsc1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgeyBjbGFzc05hbWU6IFwidGV4dC10aXRsZVwiIH0sIFwiU3Vic2NyaXB0aW9uXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJoclwiLCB7IHN0eWxlOiB7IHdpZHRoOiAnMTAwJScgfSB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcInRleHQtYm9keVwiIH0sIHN1YnNjcmlwdGlvbj8ubGVuZ3RoID8gUmVhY3QuY3JlYXRlRWxlbWVudChcInByZVwiLCBudWxsLCBzdWJzY3JpcHRpb24pIDogUmVhY3QuY3JlYXRlRWxlbWVudChQbGFjZWhvbGRlciwgeyBzdHlsZTogeyB3aWR0aDogMTAwLCBoZWlnaHQ6IDE0IH0gfSkpKSkpLFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBpZDogXCJpdGVtLTJcIiB9LFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmRcIiwgc3R5bGU6IGN1cnJlbnRBZG1pbi50aGVtZSA9PSAnZGFyaycgPyB7IGNvbG9yOiAnd2hpdGUnLCB9IDogeyBjb2xvcjogJyMwZDEzMTgnIH0gfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwiY2FyZC1kZXRhaWxzXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicFwiLCB7IGNsYXNzTmFtZTogXCJ0ZXh0LXRpdGxlXCIgfSwgXCJTdGF0dXNcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImhyXCIsIHsgc3R5bGU6IHsgd2lkdGg6ICcxMDAlJyB9IH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwidGV4dC1ib2R5XCIgfSwgc3RhdCA9PSAnQWN0aXZlJyA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIiwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCYWRnZSwgeyB2YXJpYW50OiBcInN1Y2Nlc3NcIiB9LCBcIkFjdGl2ZVwiKSkgOiBSZWFjdC5jcmVhdGVFbGVtZW50KEJhZGdlLCB7IHZhcmlhbnQ6IFwiZGFuZ2VyXCIgfSwgXCJPZmZsaW5lXCIpKSkpKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgaWQ6IFwiaXRlbS0zXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogJ2NhcmQgZGFpbHknLCBzdHlsZTogY3VycmVudEFkbWluLnRoZW1lID09ICdkYXJrJyA/IHsgYmFja2dyb3VuZDogJyMxZTFlMWUnLCBjb2xvcjogJ3doaXRlJywgYm9yZGVyOiAnMHB4IHNvbGlkICNjM2M2Y2UnIH0gOiB7IGJhY2tncm91bmQ6ICcjZjdmN2Y3JywgY29sb3I6ICcjMGQxMzE4JywgYm9yZGVyOiAnMnB4IHNvbGlkICNjM2M2Y2UnIH0gfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwiY2FyZC1kZXRhaWxzXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicFwiLCB7IGNsYXNzTmFtZTogXCJ0ZXh0LXRpdGxlXCIgfSwgXCJBbm5vdW5jZW1lbnRzXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwidGV4dC1ib2R5XCIgfSwgcGluZz8ubGVuZ3RoID8gUmVhY3QuY3JlYXRlRWxlbWVudChcInByZVwiLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicFwiLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGluZ1swXS5hbm5vdW5jZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBhdCBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpbmdbMF0uY3JlYXRlZEF0LnNwbGl0KCdUJylbMF0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicFwiLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGluZ1sxXS5hbm5vdW5jZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBhdCBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpbmdbMV0uY3JlYXRlZEF0LnNwbGl0KCdUJylbMF0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicFwiLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGluZ1syXS5hbm5vdW5jZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBhdCBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpbmdbMl0uY3JlYXRlZEF0LnNwbGl0KCdUJylbMF0pKSA6IFJlYWN0LmNyZWF0ZUVsZW1lbnQoQmFkZ2UsIHsgdmFyaWFudDogXCJkYW5nZXJcIiB9LCBcIk5vIEFubm91bmNlbWVudHNcIikpKSkpLFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBpZDogXCJpdGVtLTVcIiB9LFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiAnY2FyZCBkYWlseScsIHN0eWxlOiBjdXJyZW50QWRtaW4udGhlbWUgPT0gJ2RhcmsnID8geyBiYWNrZ3JvdW5kOiAnIzFlMWUxZScsIGNvbG9yOiAnd2hpdGUnLCBib3JkZXI6ICcwcHggc29saWQgI2MzYzZjZScgfSA6IHsgYmFja2dyb3VuZDogJyNmN2Y3ZjcnLCBjb2xvcjogJyMwZDEzMTgnLCBib3JkZXI6ICcycHggc29saWQgI2MzYzZjZScgfSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgeyBjbGFzc05hbWU6IFwidGV4dC10aXRsZVwiLCBzdHlsZTogeyB0ZXh0QWxpZ246ICdjZW50ZXInIH0gfSwgXCJEYWlseVwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwiY2FyZC1kZXRhaWxzXCIsIHN0eWxlOiB7IHBsYWNlQ29udGVudDogJ25vcm1hbCcsIHBhZGRpbmdUb3A6ICcxMHB4JyB9IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJ0ZXh0LWJvZHlcIiB9LCBsb2dzWzBdPy5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSA9PSB0b2RheSA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIiwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ3NbMF0/LmNyZWF0ZWRBdC5zcGxpdCgnVCcpWzBdID09IHRvZGF5ID8gbG9nc1swXT8uZGVzY3JpcHRpb24gOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nc1swXT8uY3JlYXRlZEF0LnNwbGl0KCdUJylbMF0gPT0gdG9kYXkgPyBcImF0XCIgOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nc1swXT8uY3JlYXRlZEF0LnNwbGl0KCdUJylbMF0gPT0gdG9kYXkgPyBsb2dzWzBdPy5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSA6ICcnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ3NbMV0/LmNyZWF0ZWRBdC5zcGxpdCgnVCcpWzBdID09IHRvZGF5ID8gbG9nc1sxXT8uZGVzY3JpcHRpb24gOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nc1sxXT8uY3JlYXRlZEF0LnNwbGl0KFwiVFwiKVswXSA9PSB0b2RheSA/IFwiYXRcIiA6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ3NbMV0/LmNyZWF0ZWRBdC5zcGxpdCgnVCcpWzBdID09IHRvZGF5ID8gbG9nc1sxXT8uY3JlYXRlZEF0LnNwbGl0KCdUJylbMF0gOiAnJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dzWzJdPy5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSA9PSB0b2RheSA/IGxvZ3NbMl0/LmRlc2NyaXB0aW9uIDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiAgXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dzWzJdPy5jcmVhdGVkQXQuc3BsaXQoXCJUXCIpWzBdID09IHRvZGF5ID8gXCJhdFwiIDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nc1syXT8uY3JlYXRlZEF0LnNwbGl0KCdUJylbMF0gPT0gdG9kYXkgPyBsb2dzWzJdPy5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSA6ICcnKSkgOiBSZWFjdC5jcmVhdGVFbGVtZW50KEJhZGdlLCB7IHZhcmlhbnQ6IFwiZGFuZ2VyXCIgfSwgXCJObyBMb2dzXCIpKSkpKSkpLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZm9vdGVyXCIsIHsgY2xhc3NOYW1lOiAnZm9vdGVyLWNvbnRlbnQnLCBzdHlsZTogY3VycmVudEFkbWluLnRoZW1lID09ICdkYXJrJyA/IHsgYmFja2dyb3VuZENvbG9yOiAnIzI4MUE0RicsIGNvbG9yOiAnd2hpdGUnIH0gOiB7IGJhY2tncm91bmRDb2xvcjogJ3doaXRlJywgY29sb3I6ICcjMGQxMzE4JyB9IH0sXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsIFwiQXNwZWN0IFN5c3RlbXMgfCBBbGwgcmlnaHRzIHJlc2VydmVkLlwiKSkpKTtcbn07XG5leHBvcnQgZGVmYXVsdCBEYXNoYm9hcmQ7XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQm94IH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5pbXBvcnQgeyBWaWV3SGVscGVycywgdXNlQ3VycmVudEFkbWluIH0gZnJvbSAnYWRtaW5qcyc7XG5jb25zdCBoID0gbmV3IFZpZXdIZWxwZXJzKCk7XG5jb25zdCBTaWRlYmFyQnJhbmRpbmcgPSAoKSA9PiB7XG4gICAgY29uc3QgW2N1cnJlbnRBZG1pbiwgc2V0Q3VycmVudEFkbWluXSA9IHVzZUN1cnJlbnRBZG1pbigpO1xuICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChCb3gsIHsgZmxleDogdHJ1ZSwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsIHB5OiBcInhsXCIsIHN0eWxlOiBjdXJyZW50QWRtaW4udGhlbWUgPT0gJ2RhcmsnID8geyBiYWNrZ3JvdW5kQ29sb3I6ICdibGFjaycgfSA6IHsgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnIH0gfSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImFcIiwgeyBocmVmOiBoLmRhc2hib2FyZFVybCgpIH0sXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiaW1nXCIsIHsgc3JjOiAnL2Fzc2V0L2xvZ290eXBlLnBuZycsIGFsdDogJ0FzcGVjdCB8IEluc3RlcCcgfSkpKSk7XG59O1xuZXhwb3J0IGRlZmF1bHQgU2lkZWJhckJyYW5kaW5nO1xuIiwiaW1wb3J0IHsgRHJvcFpvbmUsIERyb3Bab25lSXRlbSwgRm9ybUdyb3VwLCBMYWJlbCB9IGZyb20gJ0BhZG1pbmpzL2Rlc2lnbi1zeXN0ZW0nO1xuaW1wb3J0IHsgZmxhdCB9IGZyb20gJ2FkbWluanMnO1xuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5jb25zdCBFZGl0ID0gKHsgcHJvcGVydHksIHJlY29yZCwgb25DaGFuZ2UgfSkgPT4ge1xuICAgIGNvbnN0IHsgcGFyYW1zIH0gPSByZWNvcmQ7XG4gICAgY29uc3QgeyBjdXN0b20gfSA9IHByb3BlcnR5O1xuICAgIGNvbnN0IHBhdGggPSBmbGF0LmdldChwYXJhbXMsIGN1c3RvbS5maWxlUGF0aFByb3BlcnR5KTtcbiAgICBjb25zdCBrZXkgPSBmbGF0LmdldChwYXJhbXMsIGN1c3RvbS5rZXlQcm9wZXJ0eSk7XG4gICAgY29uc3QgZmlsZSA9IGZsYXQuZ2V0KHBhcmFtcywgY3VzdG9tLmZpbGVQcm9wZXJ0eSk7XG4gICAgY29uc3QgW29yaWdpbmFsS2V5LCBzZXRPcmlnaW5hbEtleV0gPSB1c2VTdGF0ZShrZXkpO1xuICAgIGNvbnN0IFtmaWxlc1RvVXBsb2FkLCBzZXRGaWxlc1RvVXBsb2FkXSA9IHVzZVN0YXRlKFtdKTtcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICAvLyBpdCBtZWFucyBtZWFucyB0aGF0IHNvbWVvbmUgaGl0IHNhdmUgYW5kIG5ldyBmaWxlIGhhcyBiZWVuIHVwbG9hZGVkXG4gICAgICAgIC8vIGluIHRoaXMgY2FzZSBmbGllc1RvVXBsb2FkIHNob3VsZCBiZSBjbGVhcmVkLlxuICAgICAgICAvLyBUaGlzIGhhcHBlbnMgd2hlbiB1c2VyIHR1cm5zIG9mZiByZWRpcmVjdCBhZnRlciBuZXcvZWRpdFxuICAgICAgICBpZiAoKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIGtleSAhPT0gb3JpZ2luYWxLZXkpXG4gICAgICAgICAgICB8fCAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycgJiYgIW9yaWdpbmFsS2V5KVxuICAgICAgICAgICAgfHwgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnICYmIEFycmF5LmlzQXJyYXkoa2V5KSAmJiBrZXkubGVuZ3RoICE9PSBvcmlnaW5hbEtleS5sZW5ndGgpKSB7XG4gICAgICAgICAgICBzZXRPcmlnaW5hbEtleShrZXkpO1xuICAgICAgICAgICAgc2V0RmlsZXNUb1VwbG9hZChbXSk7XG4gICAgICAgIH1cbiAgICB9LCBba2V5LCBvcmlnaW5hbEtleV0pO1xuICAgIGNvbnN0IG9uVXBsb2FkID0gKGZpbGVzKSA9PiB7XG4gICAgICAgIHNldEZpbGVzVG9VcGxvYWQoZmlsZXMpO1xuICAgICAgICBvbkNoYW5nZShjdXN0b20uZmlsZVByb3BlcnR5LCBmaWxlcyk7XG4gICAgfTtcbiAgICBjb25zdCBoYW5kbGVSZW1vdmUgPSAoKSA9PiB7XG4gICAgICAgIG9uQ2hhbmdlKGN1c3RvbS5maWxlUHJvcGVydHksIG51bGwpO1xuICAgIH07XG4gICAgY29uc3QgaGFuZGxlTXVsdGlSZW1vdmUgPSAoc2luZ2xlS2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gKGZsYXQuZ2V0KHJlY29yZC5wYXJhbXMsIGN1c3RvbS5rZXlQcm9wZXJ0eSkgfHwgW10pLmluZGV4T2Yoc2luZ2xlS2V5KTtcbiAgICAgICAgY29uc3QgZmlsZXNUb0RlbGV0ZSA9IGZsYXQuZ2V0KHJlY29yZC5wYXJhbXMsIGN1c3RvbS5maWxlc1RvRGVsZXRlUHJvcGVydHkpIHx8IFtdO1xuICAgICAgICBpZiAocGF0aCAmJiBwYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1BhdGggPSBwYXRoLm1hcCgoY3VycmVudFBhdGgsIGkpID0+IChpICE9PSBpbmRleCA/IGN1cnJlbnRQYXRoIDogbnVsbCkpO1xuICAgICAgICAgICAgbGV0IG5ld1BhcmFtcyA9IGZsYXQuc2V0KHJlY29yZC5wYXJhbXMsIGN1c3RvbS5maWxlc1RvRGVsZXRlUHJvcGVydHksIFsuLi5maWxlc1RvRGVsZXRlLCBpbmRleF0pO1xuICAgICAgICAgICAgbmV3UGFyYW1zID0gZmxhdC5zZXQobmV3UGFyYW1zLCBjdXN0b20uZmlsZVBhdGhQcm9wZXJ0eSwgbmV3UGF0aCk7XG4gICAgICAgICAgICBvbkNoYW5nZSh7XG4gICAgICAgICAgICAgICAgLi4ucmVjb3JkLFxuICAgICAgICAgICAgICAgIHBhcmFtczogbmV3UGFyYW1zLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1lvdSBjYW5ub3QgcmVtb3ZlIGZpbGUgd2hlbiB0aGVyZSBhcmUgbm8gdXBsb2FkZWQgZmlsZXMgeWV0Jyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChGb3JtR3JvdXAsIG51bGwsXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTGFiZWwsIG51bGwsIHByb3BlcnR5LmxhYmVsKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChEcm9wWm9uZSwgeyBvbkNoYW5nZTogb25VcGxvYWQsIG11bHRpcGxlOiBjdXN0b20ubXVsdGlwbGUsIHZhbGlkYXRlOiB7XG4gICAgICAgICAgICAgICAgbWltZVR5cGVzOiBjdXN0b20ubWltZVR5cGVzLFxuICAgICAgICAgICAgICAgIG1heFNpemU6IGN1c3RvbS5tYXhTaXplLFxuICAgICAgICAgICAgfSwgZmlsZXM6IGZpbGVzVG9VcGxvYWQgfSksXG4gICAgICAgICFjdXN0b20ubXVsdGlwbGUgJiYga2V5ICYmIHBhdGggJiYgIWZpbGVzVG9VcGxvYWQubGVuZ3RoICYmIGZpbGUgIT09IG51bGwgJiYgKFJlYWN0LmNyZWF0ZUVsZW1lbnQoRHJvcFpvbmVJdGVtLCB7IGZpbGVuYW1lOiBrZXksIHNyYzogcGF0aCwgb25SZW1vdmU6IGhhbmRsZVJlbW92ZSB9KSksXG4gICAgICAgIGN1c3RvbS5tdWx0aXBsZSAmJiBrZXkgJiYga2V5Lmxlbmd0aCAmJiBwYXRoID8gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoUmVhY3QuRnJhZ21lbnQsIG51bGwsIGtleS5tYXAoKHNpbmdsZUtleSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIC8vIHdoZW4gd2UgcmVtb3ZlIGl0ZW1zIHdlIHNldCBvbmx5IHBhdGggaW5kZXggdG8gbnVsbHMuXG4gICAgICAgICAgICAvLyBrZXkgaXMgc3RpbGwgdGhlcmUuIFRoaXMgaXMgYmVjYXVzZVxuICAgICAgICAgICAgLy8gd2UgaGF2ZSB0byBtYWludGFpbiBhbGwgdGhlIGluZGV4ZXMuIFNvIGhlcmUgd2Ugc2ltcGx5IGZpbHRlciBvdXQgZWxlbWVudHMgd2hpY2hcbiAgICAgICAgICAgIC8vIHdlcmUgcmVtb3ZlZCBhbmQgZGlzcGxheSBvbmx5IHdoYXQgd2FzIGxlZnRcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRQYXRoID0gcGF0aFtpbmRleF07XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFBhdGggPyAoUmVhY3QuY3JlYXRlRWxlbWVudChEcm9wWm9uZUl0ZW0sIHsga2V5OiBzaW5nbGVLZXksIGZpbGVuYW1lOiBzaW5nbGVLZXksIHNyYzogcGF0aFtpbmRleF0sIG9uUmVtb3ZlOiAoKSA9PiBoYW5kbGVNdWx0aVJlbW92ZShzaW5nbGVLZXkpIH0pKSA6ICcnO1xuICAgICAgICB9KSkpIDogJycpKTtcbn07XG5leHBvcnQgZGVmYXVsdCBFZGl0O1xuIiwiZXhwb3J0IGNvbnN0IEF1ZGlvTWltZVR5cGVzID0gW1xuICAgICdhdWRpby9hYWMnLFxuICAgICdhdWRpby9taWRpJyxcbiAgICAnYXVkaW8veC1taWRpJyxcbiAgICAnYXVkaW8vbXBlZycsXG4gICAgJ2F1ZGlvL29nZycsXG4gICAgJ2FwcGxpY2F0aW9uL29nZycsXG4gICAgJ2F1ZGlvL29wdXMnLFxuICAgICdhdWRpby93YXYnLFxuICAgICdhdWRpby93ZWJtJyxcbiAgICAnYXVkaW8vM2dwcDInLFxuXTtcbmV4cG9ydCBjb25zdCBWaWRlb01pbWVUeXBlcyA9IFtcbiAgICAndmlkZW8veC1tc3ZpZGVvJyxcbiAgICAndmlkZW8vbXBlZycsXG4gICAgJ3ZpZGVvL29nZycsXG4gICAgJ3ZpZGVvL21wMnQnLFxuICAgICd2aWRlby93ZWJtJyxcbiAgICAndmlkZW8vM2dwcCcsXG4gICAgJ3ZpZGVvLzNncHAyJyxcbl07XG5leHBvcnQgY29uc3QgSW1hZ2VNaW1lVHlwZXMgPSBbXG4gICAgJ2ltYWdlL2JtcCcsXG4gICAgJ2ltYWdlL2dpZicsXG4gICAgJ2ltYWdlL2pwZWcnLFxuICAgICdpbWFnZS9wbmcnLFxuICAgICdpbWFnZS9zdmcreG1sJyxcbiAgICAnaW1hZ2Uvdm5kLm1pY3Jvc29mdC5pY29uJyxcbiAgICAnaW1hZ2UvdGlmZicsXG4gICAgJ2ltYWdlL3dlYnAnLFxuXTtcbmV4cG9ydCBjb25zdCBDb21wcmVzc2VkTWltZVR5cGVzID0gW1xuICAgICdhcHBsaWNhdGlvbi94LWJ6aXAnLFxuICAgICdhcHBsaWNhdGlvbi94LWJ6aXAyJyxcbiAgICAnYXBwbGljYXRpb24vZ3ppcCcsXG4gICAgJ2FwcGxpY2F0aW9uL2phdmEtYXJjaGl2ZScsXG4gICAgJ2FwcGxpY2F0aW9uL3gtdGFyJyxcbiAgICAnYXBwbGljYXRpb24vemlwJyxcbiAgICAnYXBwbGljYXRpb24veC03ei1jb21wcmVzc2VkJyxcbl07XG5leHBvcnQgY29uc3QgRG9jdW1lbnRNaW1lVHlwZXMgPSBbXG4gICAgJ2FwcGxpY2F0aW9uL3gtYWJpd29yZCcsXG4gICAgJ2FwcGxpY2F0aW9uL3gtZnJlZWFyYycsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5hbWF6b24uZWJvb2snLFxuICAgICdhcHBsaWNhdGlvbi9tc3dvcmQnLFxuICAgICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5kb2N1bWVudCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5tcy1mb250b2JqZWN0JyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5wcmVzZW50YXRpb24nLFxuICAgICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0JyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC50ZXh0JyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQnLFxuICAgICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwucHJlc2VudGF0aW9uJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLnJhcicsXG4gICAgJ2FwcGxpY2F0aW9uL3J0ZicsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnNoZWV0Jyxcbl07XG5leHBvcnQgY29uc3QgVGV4dE1pbWVUeXBlcyA9IFtcbiAgICAndGV4dC9jc3MnLFxuICAgICd0ZXh0L2NzdicsXG4gICAgJ3RleHQvaHRtbCcsXG4gICAgJ3RleHQvY2FsZW5kYXInLFxuICAgICd0ZXh0L2phdmFzY3JpcHQnLFxuICAgICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAnYXBwbGljYXRpb24vbGQranNvbicsXG4gICAgJ3RleHQvamF2YXNjcmlwdCcsXG4gICAgJ3RleHQvcGxhaW4nLFxuICAgICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnLFxuICAgICdhcHBsaWNhdGlvbi94bWwnLFxuICAgICd0ZXh0L3htbCcsXG5dO1xuZXhwb3J0IGNvbnN0IEJpbmFyeURvY3NNaW1lVHlwZXMgPSBbXG4gICAgJ2FwcGxpY2F0aW9uL2VwdWIremlwJyxcbiAgICAnYXBwbGljYXRpb24vcGRmJyxcbl07XG5leHBvcnQgY29uc3QgRm9udE1pbWVUeXBlcyA9IFtcbiAgICAnZm9udC9vdGYnLFxuICAgICdmb250L3R0ZicsXG4gICAgJ2ZvbnQvd29mZicsXG4gICAgJ2ZvbnQvd29mZjInLFxuXTtcbmV4cG9ydCBjb25zdCBPdGhlck1pbWVUeXBlcyA9IFtcbiAgICAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyxcbiAgICAnYXBwbGljYXRpb24veC1jc2gnLFxuICAgICdhcHBsaWNhdGlvbi92bmQuYXBwbGUuaW5zdGFsbGVyK3htbCcsXG4gICAgJ2FwcGxpY2F0aW9uL3gtaHR0cGQtcGhwJyxcbiAgICAnYXBwbGljYXRpb24veC1zaCcsXG4gICAgJ2FwcGxpY2F0aW9uL3gtc2hvY2t3YXZlLWZsYXNoJyxcbiAgICAndm5kLnZpc2lvJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm1vemlsbGEueHVsK3htbCcsXG5dO1xuZXhwb3J0IGNvbnN0IE1pbWVUeXBlcyA9IFtcbiAgICAuLi5BdWRpb01pbWVUeXBlcyxcbiAgICAuLi5WaWRlb01pbWVUeXBlcyxcbiAgICAuLi5JbWFnZU1pbWVUeXBlcyxcbiAgICAuLi5Db21wcmVzc2VkTWltZVR5cGVzLFxuICAgIC4uLkRvY3VtZW50TWltZVR5cGVzLFxuICAgIC4uLlRleHRNaW1lVHlwZXMsXG4gICAgLi4uQmluYXJ5RG9jc01pbWVUeXBlcyxcbiAgICAuLi5PdGhlck1pbWVUeXBlcyxcbiAgICAuLi5Gb250TWltZVR5cGVzLFxuICAgIC4uLk90aGVyTWltZVR5cGVzLFxuXTtcbiIsIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXNcbmltcG9ydCB7IEJveCwgQnV0dG9uLCBJY29uIH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5pbXBvcnQgeyBmbGF0IH0gZnJvbSAnYWRtaW5qcyc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQXVkaW9NaW1lVHlwZXMsIEltYWdlTWltZVR5cGVzIH0gZnJvbSAnLi4vdHlwZXMvbWltZS10eXBlcy50eXBlLmpzJztcbmNvbnN0IFNpbmdsZUZpbGUgPSAocHJvcHMpID0+IHtcbiAgICBjb25zdCB7IG5hbWUsIHBhdGgsIG1pbWVUeXBlLCB3aWR0aCB9ID0gcHJvcHM7XG4gICAgaWYgKHBhdGggJiYgcGF0aC5sZW5ndGgpIHtcbiAgICAgICAgaWYgKG1pbWVUeXBlICYmIEltYWdlTWltZVR5cGVzLmluY2x1ZGVzKG1pbWVUeXBlKSkge1xuICAgICAgICAgICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KFwiaW1nXCIsIHsgc3JjOiBwYXRoLCBzdHlsZTogeyBtYXhIZWlnaHQ6IHdpZHRoLCBtYXhXaWR0aDogd2lkdGggfSwgYWx0OiBuYW1lIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWltZVR5cGUgJiYgQXVkaW9NaW1lVHlwZXMuaW5jbHVkZXMobWltZVR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJhdWRpb1wiLCB7IGNvbnRyb2xzOiB0cnVlLCBzcmM6IHBhdGggfSxcbiAgICAgICAgICAgICAgICBcIllvdXIgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHRoZVwiLFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJjb2RlXCIsIG51bGwsIFwiYXVkaW9cIiksXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInRyYWNrXCIsIHsga2luZDogXCJjYXB0aW9uc1wiIH0pKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KEJveCwgbnVsbCxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCdXR0b24sIHsgYXM6IFwiYVwiLCBocmVmOiBwYXRoLCBtbDogXCJkZWZhdWx0XCIsIHNpemU6IFwic21cIiwgcm91bmRlZDogdHJ1ZSwgdGFyZ2V0OiBcIl9ibGFua1wiIH0sXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEljb24sIHsgaWNvbjogXCJEb2N1bWVudERvd25sb2FkXCIsIGNvbG9yOiBcIndoaXRlXCIsIG1yOiBcImRlZmF1bHRcIiB9KSxcbiAgICAgICAgICAgIG5hbWUpKSk7XG59O1xuY29uc3QgRmlsZSA9ICh7IHdpZHRoLCByZWNvcmQsIHByb3BlcnR5IH0pID0+IHtcbiAgICBjb25zdCB7IGN1c3RvbSB9ID0gcHJvcGVydHk7XG4gICAgbGV0IHBhdGggPSBmbGF0LmdldChyZWNvcmQ/LnBhcmFtcywgY3VzdG9tLmZpbGVQYXRoUHJvcGVydHkpO1xuICAgIGlmICghcGF0aCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbmFtZSA9IGZsYXQuZ2V0KHJlY29yZD8ucGFyYW1zLCBjdXN0b20uZmlsZU5hbWVQcm9wZXJ0eSA/IGN1c3RvbS5maWxlTmFtZVByb3BlcnR5IDogY3VzdG9tLmtleVByb3BlcnR5KTtcbiAgICBjb25zdCBtaW1lVHlwZSA9IGN1c3RvbS5taW1lVHlwZVByb3BlcnR5XG4gICAgICAgICYmIGZsYXQuZ2V0KHJlY29yZD8ucGFyYW1zLCBjdXN0b20ubWltZVR5cGVQcm9wZXJ0eSk7XG4gICAgaWYgKCFwcm9wZXJ0eS5jdXN0b20ubXVsdGlwbGUpIHtcbiAgICAgICAgaWYgKGN1c3RvbS5vcHRzICYmIGN1c3RvbS5vcHRzLmJhc2VVcmwpIHtcbiAgICAgICAgICAgIHBhdGggPSBgJHtjdXN0b20ub3B0cy5iYXNlVXJsfS8ke25hbWV9YDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoU2luZ2xlRmlsZSwgeyBwYXRoOiBwYXRoLCBuYW1lOiBuYW1lLCB3aWR0aDogd2lkdGgsIG1pbWVUeXBlOiBtaW1lVHlwZSB9KSk7XG4gICAgfVxuICAgIGlmIChjdXN0b20ub3B0cyAmJiBjdXN0b20ub3B0cy5iYXNlVXJsKSB7XG4gICAgICAgIGNvbnN0IGJhc2VVcmwgPSBjdXN0b20ub3B0cy5iYXNlVXJsIHx8ICcnO1xuICAgICAgICBwYXRoID0gcGF0aC5tYXAoKHNpbmdsZVBhdGgsIGluZGV4KSA9PiBgJHtiYXNlVXJsfS8ke25hbWVbaW5kZXhdfWApO1xuICAgIH1cbiAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoUmVhY3QuRnJhZ21lbnQsIG51bGwsIHBhdGgubWFwKChzaW5nbGVQYXRoLCBpbmRleCkgPT4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoU2luZ2xlRmlsZSwgeyBrZXk6IHNpbmdsZVBhdGgsIHBhdGg6IHNpbmdsZVBhdGgsIG5hbWU6IG5hbWVbaW5kZXhdLCB3aWR0aDogd2lkdGgsIG1pbWVUeXBlOiBtaW1lVHlwZVtpbmRleF0gfSkpKSkpO1xufTtcbmV4cG9ydCBkZWZhdWx0IEZpbGU7XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IEZpbGUgZnJvbSAnLi9maWxlLmpzJztcbmNvbnN0IExpc3QgPSAocHJvcHMpID0+IChSZWFjdC5jcmVhdGVFbGVtZW50KEZpbGUsIHsgd2lkdGg6IDEwMCwgLi4ucHJvcHMgfSkpO1xuZXhwb3J0IGRlZmF1bHQgTGlzdDtcbiIsImltcG9ydCB7IEZvcm1Hcm91cCwgTGFiZWwgfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgRmlsZSBmcm9tICcuL2ZpbGUuanMnO1xuY29uc3QgU2hvdyA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IHsgcHJvcGVydHkgfSA9IHByb3BzO1xuICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChGb3JtR3JvdXAsIG51bGwsXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTGFiZWwsIG51bGwsIHByb3BlcnR5LmxhYmVsKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGaWxlLCB7IHdpZHRoOiBcIjEwMCVcIiwgLi4ucHJvcHMgfSkpKTtcbn07XG5leHBvcnQgZGVmYXVsdCBTaG93O1xuIiwiQWRtaW5KUy5Vc2VyQ29tcG9uZW50cyA9IHt9XG5pbXBvcnQgRGFzaGJvYXJkIGZyb20gJy4uL2Rpc3QvY29tcG9uZW50cy9teS1kYXNoYm9hcmQtY29tcG9uZW50J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5EYXNoYm9hcmQgPSBEYXNoYm9hcmRcbmltcG9ydCBUb3BCYXIgZnJvbSAnLi4vZGlzdC9jb21wb25lbnRzL25hdmJhcidcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuVG9wQmFyID0gVG9wQmFyXG5pbXBvcnQgU2lkZWJhckJyYW5kaW5nIGZyb20gJy4uL2Rpc3QvY29tcG9uZW50cy9TaWRlYmFyQnJhbmRpbmcnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLlNpZGViYXJCcmFuZGluZyA9IFNpZGViYXJCcmFuZGluZ1xuaW1wb3J0IFVwbG9hZEVkaXRDb21wb25lbnQgZnJvbSAnLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS9jb21wb25lbnRzL1VwbG9hZEVkaXRDb21wb25lbnQnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLlVwbG9hZEVkaXRDb21wb25lbnQgPSBVcGxvYWRFZGl0Q29tcG9uZW50XG5pbXBvcnQgVXBsb2FkTGlzdENvbXBvbmVudCBmcm9tICcuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkTGlzdENvbXBvbmVudCdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuVXBsb2FkTGlzdENvbXBvbmVudCA9IFVwbG9hZExpc3RDb21wb25lbnRcbmltcG9ydCBVcGxvYWRTaG93Q29tcG9uZW50IGZyb20gJy4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRTaG93Q29tcG9uZW50J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5VcGxvYWRTaG93Q29tcG9uZW50ID0gVXBsb2FkU2hvd0NvbXBvbmVudCJdLCJuYW1lcyI6WyJSZWFjdCIsInJlcXVpcmUkJDAiLCJ0b2dnbGVyIiwiVG9wQmFyIiwicHJvcHMiLCJjdXJyZW50QWRtaW4iLCJzZXRDdXJyZW50QWRtaW4iLCJ1c2VDdXJyZW50QWRtaW4iLCJ0b2dnbGVTaWRlYmFyIiwidXNlU2VsZWN0b3IiLCJzdGF0ZSIsInNlc3Npb24iLCJwYXRocyIsInZlcnNpb25zIiwiZmlsZVBhdGgiLCJuYW1lIiwicm9sZSIsImNyZWF0ZUVsZW1lbnQiLCJCb3giLCJib3JkZXIiLCJmbGV4IiwiZmxleERpcmVjdGlvbiIsImhlaWdodCIsInN0eWxlIiwidGhlbWUiLCJiYWNrZ3JvdW5kQ29sb3IiLCJjb2xvciIsIkN1cnJlbnRVc2VyTmF2IiwiZHJvcEFjdGlvbnMiLCJpY29uIiwibGFiZWwiLCJocmVmIiwib25DbGljayIsIm5vUmVmQ2hlY2siLCJsaW5lQWN0aW9ucyIsInRpdGxlIiwiYXZhdGFyVXJsIiwiYXBpIiwiQXBpQ2xpZW50IiwiRGFzaGJvYXJkIiwidGV4dCIsInNldFRleHQiLCJ1c2VTdGF0ZSIsInN1YnNjcmlwdGlvbiIsInNldFN1YnNjcmlwdGlvbiIsInN0YXQiLCJzZXRTdGF0IiwibG9ncyIsInNldExvZ3MiLCJwaW5nIiwic2V0UGluZyIsInVzZXIiLCJzZXRVc2VyIiwiaGFuZGxlcnMiLCJ1c2VTd2lwZWFibGUiLCJvblN3aXBlZFJpZ2h0Iiwic3dpcGVEdXJhdGlvbiIsInByZXZlbnRTY3JvbGxPblN3aXBlIiwidHJhY2tNb3VzZSIsInVzZU5vdGljZSIsInVzZUVmZmVjdCIsImdldERhc2hib2FyZCIsInRoZW4iLCJyZXMiLCJkYXRhIiwic3Vic2NyaXB0aW9uX3R5cGUiLCJpc0FjdGl2ZSIsIkNhcmQiLCJzdHlsZWQiLCJ0b2RheSIsIkRhdGUiLCJkZCIsImdldERhdGUiLCJtbSIsImdldE1vbnRoIiwieXl5eSIsImdldEZ1bGxZZWFyIiwiY2xhc3NOYW1lIiwibWFyZ2luTGVmdCIsInBhZGRpbmdUb3AiLCJpZCIsIndpZHRoIiwibGVuZ3RoIiwiUGxhY2Vob2xkZXIiLCJCYWRnZSIsInZhcmlhbnQiLCJiYWNrZ3JvdW5kIiwiYW5ub3VuY2VtZW50IiwiY3JlYXRlZEF0Iiwic3BsaXQiLCJ0ZXh0QWxpZ24iLCJwbGFjZUNvbnRlbnQiLCJkZXNjcmlwdGlvbiIsImgiLCJWaWV3SGVscGVycyIsIlNpZGViYXJCcmFuZGluZyIsImFsaWduSXRlbXMiLCJqdXN0aWZ5Q29udGVudCIsInB5IiwiZGFzaGJvYXJkVXJsIiwic3JjIiwiYWx0IiwiZmxhdCIsIkZvcm1Hcm91cCIsIkxhYmVsIiwiRHJvcFpvbmUiLCJEcm9wWm9uZUl0ZW0iLCJCdXR0b24iLCJJY29uIiwiQWRtaW5KUyIsIlVzZXJDb21wb25lbnRzIiwiVXBsb2FkRWRpdENvbXBvbmVudCIsIlVwbG9hZExpc3RDb21wb25lbnQiLCJVcGxvYWRTaG93Q29tcG9uZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7SUFFQSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUM5RDtJQUNBLElBQUlBLE9BQUssR0FBR0Msc0JBQWdCLENBQUM7QUFDN0I7SUFDQSxNQUFNLElBQUksR0FBRyxNQUFN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LFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFO0lBQy9HLEtBQUs7SUFDTCxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtJQUM1QyxRQUFRLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztJQUNsRCxRQUFRLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLEtBQUssS0FBSyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUUsS0FBSztJQUNMLElBQUksUUFBUUEsc0JBQUssQ0FBQyxhQUFhLENBQUNBLHNCQUFLLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLEtBQUssTUFBTUEsc0JBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtJQUM5TixDQUFDOztJQ3pDRCxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssTUFBTUEsc0JBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUM7O0lDQzdFLE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxLQUFLO0lBQ3hCLElBQUksTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUMvQixJQUFJLFFBQVFBLHNCQUFLLENBQUMsYUFBYSxDQUFDdUcsc0JBQVMsRUFBRSxJQUFJO0lBQy9DLFFBQVF2RyxzQkFBSyxDQUFDLGFBQWEsQ0FBQ3dHLGtCQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUM7SUFDeEQsUUFBUXhHLHNCQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDakUsQ0FBQzs7SUNSRDZHLE9BQU8sQ0FBQ0MsY0FBYyxHQUFHLEVBQUUsQ0FBQTtJQUUzQkQsT0FBTyxDQUFDQyxjQUFjLENBQUN2RSxTQUFTLEdBQUdBLFNBQVMsQ0FBQTtJQUU1Q3NFLE9BQU8sQ0FBQ0MsY0FBYyxDQUFDM0csTUFBTSxHQUFHQSxNQUFNLENBQUE7SUFFdEMwRyxPQUFPLENBQUNDLGNBQWMsQ0FBQ2YsZUFBZSxHQUFHQSxlQUFlLENBQUE7SUFFeERjLE9BQU8sQ0FBQ0MsY0FBYyxDQUFDQyxtQkFBbUIsR0FBR0EsSUFBbUIsQ0FBQTtJQUVoRUYsT0FBTyxDQUFDQyxjQUFjLENBQUNFLG1CQUFtQixHQUFHQSxJQUFtQixDQUFBO0lBRWhFSCxPQUFPLENBQUNDLGNBQWMsQ0FBQ0csbUJBQW1CLEdBQUdBLElBQW1COzs7Ozs7IiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsNCw1LDYsNyw4XX0=
