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
        avatarUrl: '/asset/files/' + currentAdmin.name + '/' + currentAdmin.role + '.png'
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
      }, "Username"), /*#__PURE__*/React__default.default.createElement("div", {
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
      }, "Subscription"), /*#__PURE__*/React__default.default.createElement("div", {
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
      }, "Status"), /*#__PURE__*/React__default.default.createElement("div", {
        className: "text-body"
      }, stat == 'Active' ? /*#__PURE__*/React__default.default.createElement("pre", null, /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
        variant: "success"
      }, "Active")) : /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
        variant: "danger"
      }, "Offline"))))), /*#__PURE__*/React__default.default.createElement("div", {
        id: "item-3"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: 'card',
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
        id: "item-4"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: 'card',
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
      }, "Anti Exploit"), /*#__PURE__*/React__default.default.createElement("p", {
        className: 'text-body'
      }, "Lorem ipsum sit dolor amet lorem ipsum")))), /*#__PURE__*/React__default.default.createElement("div", {
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
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card-details"
      }, /*#__PURE__*/React__default.default.createElement("p", {
        className: "text-title"
      }, "Daily"), /*#__PURE__*/React__default.default.createElement("div", {
        className: "text-body"
      }, logs?.length ? /*#__PURE__*/React__default.default.createElement("pre", null, /*#__PURE__*/React__default.default.createElement("p", null, logs[0].description, " at ", logs[0].createdAt.split('T')[0]), /*#__PURE__*/React__default.default.createElement("p", null, logs[1].description, " at ", logs[1].createdAt.split('T')[0]), /*#__PURE__*/React__default.default.createElement("p", null, logs[2].description, " at ", logs[2].createdAt.split('T')[0])) : /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvcmVhY3Qtc3dpcGVhYmxlL2xpYi9pbmRleC5qcyIsIi4uL2Rpc3QvY29tcG9uZW50cy9uYXZiYXIuanMiLCIuLi9kaXN0L2NvbXBvbmVudHMvbXktZGFzaGJvYXJkLWNvbXBvbmVudC5qcyIsIi4uL2Rpc3QvY29tcG9uZW50cy9TaWRlYmFyQnJhbmRpbmcuanMiLCIuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkRWRpdENvbXBvbmVudC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvdHlwZXMvbWltZS10eXBlcy50eXBlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS9jb21wb25lbnRzL2ZpbGUuanMiLCIuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkTGlzdENvbXBvbmVudC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRTaG93Q29tcG9uZW50LmpzIiwiLmVudHJ5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxuY29uc3QgTEVGVCA9IFwiTGVmdFwiO1xuY29uc3QgUklHSFQgPSBcIlJpZ2h0XCI7XG5jb25zdCBVUCA9IFwiVXBcIjtcbmNvbnN0IERPV04gPSBcIkRvd25cIjtcblxuLyogZ2xvYmFsIGRvY3VtZW50ICovXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XG4gICAgZGVsdGE6IDEwLFxuICAgIHByZXZlbnRTY3JvbGxPblN3aXBlOiBmYWxzZSxcbiAgICByb3RhdGlvbkFuZ2xlOiAwLFxuICAgIHRyYWNrTW91c2U6IGZhbHNlLFxuICAgIHRyYWNrVG91Y2g6IHRydWUsXG4gICAgc3dpcGVEdXJhdGlvbjogSW5maW5pdHksXG4gICAgdG91Y2hFdmVudE9wdGlvbnM6IHsgcGFzc2l2ZTogdHJ1ZSB9LFxufTtcbmNvbnN0IGluaXRpYWxTdGF0ZSA9IHtcbiAgICBmaXJzdDogdHJ1ZSxcbiAgICBpbml0aWFsOiBbMCwgMF0sXG4gICAgc3RhcnQ6IDAsXG4gICAgc3dpcGluZzogZmFsc2UsXG4gICAgeHk6IFswLCAwXSxcbn07XG5jb25zdCBtb3VzZU1vdmUgPSBcIm1vdXNlbW92ZVwiO1xuY29uc3QgbW91c2VVcCA9IFwibW91c2V1cFwiO1xuY29uc3QgdG91Y2hFbmQgPSBcInRvdWNoZW5kXCI7XG5jb25zdCB0b3VjaE1vdmUgPSBcInRvdWNobW92ZVwiO1xuY29uc3QgdG91Y2hTdGFydCA9IFwidG91Y2hzdGFydFwiO1xuZnVuY3Rpb24gZ2V0RGlyZWN0aW9uKGFic1gsIGFic1ksIGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgaWYgKGFic1ggPiBhYnNZKSB7XG4gICAgICAgIGlmIChkZWx0YVggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUklHSFQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIExFRlQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGRlbHRhWSA+IDApIHtcbiAgICAgICAgcmV0dXJuIERPV047XG4gICAgfVxuICAgIHJldHVybiBVUDtcbn1cbmZ1bmN0aW9uIHJvdGF0ZVhZQnlBbmdsZShwb3MsIGFuZ2xlKSB7XG4gICAgaWYgKGFuZ2xlID09PSAwKVxuICAgICAgICByZXR1cm4gcG9zO1xuICAgIGNvbnN0IGFuZ2xlSW5SYWRpYW5zID0gKE1hdGguUEkgLyAxODApICogYW5nbGU7XG4gICAgY29uc3QgeCA9IHBvc1swXSAqIE1hdGguY29zKGFuZ2xlSW5SYWRpYW5zKSArIHBvc1sxXSAqIE1hdGguc2luKGFuZ2xlSW5SYWRpYW5zKTtcbiAgICBjb25zdCB5ID0gcG9zWzFdICogTWF0aC5jb3MoYW5nbGVJblJhZGlhbnMpIC0gcG9zWzBdICogTWF0aC5zaW4oYW5nbGVJblJhZGlhbnMpO1xuICAgIHJldHVybiBbeCwgeV07XG59XG5mdW5jdGlvbiBnZXRIYW5kbGVycyhzZXQsIGhhbmRsZXJQcm9wcykge1xuICAgIGNvbnN0IG9uU3RhcnQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgaXNUb3VjaCA9IFwidG91Y2hlc1wiIGluIGV2ZW50O1xuICAgICAgICAvLyBpZiBtb3JlIHRoYW4gYSBzaW5nbGUgdG91Y2ggZG9uJ3QgdHJhY2ssIGZvciBub3cuLi5cbiAgICAgICAgaWYgKGlzVG91Y2ggJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPiAxKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBzZXQoKHN0YXRlLCBwcm9wcykgPT4ge1xuICAgICAgICAgICAgLy8gc2V0dXAgbW91c2UgbGlzdGVuZXJzIG9uIGRvY3VtZW50IHRvIHRyYWNrIHN3aXBlIHNpbmNlIHN3aXBlIGNhbiBsZWF2ZSBjb250YWluZXJcbiAgICAgICAgICAgIGlmIChwcm9wcy50cmFja01vdXNlICYmICFpc1RvdWNoKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihtb3VzZU1vdmUsIG9uTW92ZSk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihtb3VzZVVwLCBvblVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHsgY2xpZW50WCwgY2xpZW50WSB9ID0gaXNUb3VjaCA/IGV2ZW50LnRvdWNoZXNbMF0gOiBldmVudDtcbiAgICAgICAgICAgIGNvbnN0IHh5ID0gcm90YXRlWFlCeUFuZ2xlKFtjbGllbnRYLCBjbGllbnRZXSwgcHJvcHMucm90YXRpb25BbmdsZSk7XG4gICAgICAgICAgICBwcm9wcy5vblRvdWNoU3RhcnRPck9uTW91c2VEb3duICYmXG4gICAgICAgICAgICAgICAgcHJvcHMub25Ub3VjaFN0YXJ0T3JPbk1vdXNlRG93bih7IGV2ZW50IH0pO1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSksIGluaXRpYWxTdGF0ZSksIHsgaW5pdGlhbDogeHkuc2xpY2UoKSwgeHksIHN0YXJ0OiBldmVudC50aW1lU3RhbXAgfHwgMCB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBvbk1vdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgc2V0KChzdGF0ZSwgcHJvcHMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlzVG91Y2ggPSBcInRvdWNoZXNcIiBpbiBldmVudDtcbiAgICAgICAgICAgIC8vIERpc2NvdW50IGEgc3dpcGUgaWYgYWRkaXRpb25hbCB0b3VjaGVzIGFyZSBwcmVzZW50IGFmdGVyXG4gICAgICAgICAgICAvLyBhIHN3aXBlIGhhcyBzdGFydGVkLlxuICAgICAgICAgICAgaWYgKGlzVG91Y2ggJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgc3dpcGUgaGFzIGV4Y2VlZGVkIGR1cmF0aW9uIHN0b3AgdHJhY2tpbmdcbiAgICAgICAgICAgIGlmIChldmVudC50aW1lU3RhbXAgLSBzdGF0ZS5zdGFydCA+IHByb3BzLnN3aXBlRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUuc3dpcGluZyA/IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCB7IHN3aXBpbmc6IGZhbHNlIH0pIDogc3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGlzVG91Y2ggPyBldmVudC50b3VjaGVzWzBdIDogZXZlbnQ7XG4gICAgICAgICAgICBjb25zdCBbeCwgeV0gPSByb3RhdGVYWUJ5QW5nbGUoW2NsaWVudFgsIGNsaWVudFldLCBwcm9wcy5yb3RhdGlvbkFuZ2xlKTtcbiAgICAgICAgICAgIGNvbnN0IGRlbHRhWCA9IHggLSBzdGF0ZS54eVswXTtcbiAgICAgICAgICAgIGNvbnN0IGRlbHRhWSA9IHkgLSBzdGF0ZS54eVsxXTtcbiAgICAgICAgICAgIGNvbnN0IGFic1ggPSBNYXRoLmFicyhkZWx0YVgpO1xuICAgICAgICAgICAgY29uc3QgYWJzWSA9IE1hdGguYWJzKGRlbHRhWSk7XG4gICAgICAgICAgICBjb25zdCB0aW1lID0gKGV2ZW50LnRpbWVTdGFtcCB8fCAwKSAtIHN0YXRlLnN0YXJ0O1xuICAgICAgICAgICAgY29uc3QgdmVsb2NpdHkgPSBNYXRoLnNxcnQoYWJzWCAqIGFic1ggKyBhYnNZICogYWJzWSkgLyAodGltZSB8fCAxKTtcbiAgICAgICAgICAgIGNvbnN0IHZ4dnkgPSBbZGVsdGFYIC8gKHRpbWUgfHwgMSksIGRlbHRhWSAvICh0aW1lIHx8IDEpXTtcbiAgICAgICAgICAgIGNvbnN0IGRpciA9IGdldERpcmVjdGlvbihhYnNYLCBhYnNZLCBkZWx0YVgsIGRlbHRhWSk7XG4gICAgICAgICAgICAvLyBpZiBzd2lwZSBpcyB1bmRlciBkZWx0YSBhbmQgd2UgaGF2ZSBub3Qgc3RhcnRlZCB0byB0cmFjayBhIHN3aXBlOiBza2lwIHVwZGF0ZVxuICAgICAgICAgICAgY29uc3QgZGVsdGEgPSB0eXBlb2YgcHJvcHMuZGVsdGEgPT09IFwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICA/IHByb3BzLmRlbHRhXG4gICAgICAgICAgICAgICAgOiBwcm9wcy5kZWx0YVtkaXIudG9Mb3dlckNhc2UoKV0gfHxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFByb3BzLmRlbHRhO1xuICAgICAgICAgICAgaWYgKGFic1ggPCBkZWx0YSAmJiBhYnNZIDwgZGVsdGEgJiYgIXN0YXRlLnN3aXBpbmcpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICAgICAgY29uc3QgZXZlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIGFic1gsXG4gICAgICAgICAgICAgICAgYWJzWSxcbiAgICAgICAgICAgICAgICBkZWx0YVgsXG4gICAgICAgICAgICAgICAgZGVsdGFZLFxuICAgICAgICAgICAgICAgIGRpcixcbiAgICAgICAgICAgICAgICBldmVudCxcbiAgICAgICAgICAgICAgICBmaXJzdDogc3RhdGUuZmlyc3QsXG4gICAgICAgICAgICAgICAgaW5pdGlhbDogc3RhdGUuaW5pdGlhbCxcbiAgICAgICAgICAgICAgICB2ZWxvY2l0eSxcbiAgICAgICAgICAgICAgICB2eHZ5LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIGNhbGwgb25Td2lwZVN0YXJ0IGlmIHByZXNlbnQgYW5kIGlzIGZpcnN0IHN3aXBlIGV2ZW50XG4gICAgICAgICAgICBldmVudERhdGEuZmlyc3QgJiYgcHJvcHMub25Td2lwZVN0YXJ0ICYmIHByb3BzLm9uU3dpcGVTdGFydChldmVudERhdGEpO1xuICAgICAgICAgICAgLy8gY2FsbCBvblN3aXBpbmcgaWYgcHJlc2VudFxuICAgICAgICAgICAgcHJvcHMub25Td2lwaW5nICYmIHByb3BzLm9uU3dpcGluZyhldmVudERhdGEpO1xuICAgICAgICAgICAgLy8gdHJhY2sgaWYgYSBzd2lwZSBpcyBjYW5jZWxhYmxlIChoYW5kbGVyIGZvciBzd2lwaW5nIG9yIHN3aXBlZChkaXIpIGV4aXN0cylcbiAgICAgICAgICAgIC8vIHNvIHdlIGNhbiBjYWxsIHByZXZlbnREZWZhdWx0IGlmIG5lZWRlZFxuICAgICAgICAgICAgbGV0IGNhbmNlbGFibGVQYWdlU3dpcGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChwcm9wcy5vblN3aXBpbmcgfHxcbiAgICAgICAgICAgICAgICBwcm9wcy5vblN3aXBlZCB8fFxuICAgICAgICAgICAgICAgIHByb3BzW2BvblN3aXBlZCR7ZGlyfWBdKSB7XG4gICAgICAgICAgICAgICAgY2FuY2VsYWJsZVBhZ2VTd2lwZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2FuY2VsYWJsZVBhZ2VTd2lwZSAmJlxuICAgICAgICAgICAgICAgIHByb3BzLnByZXZlbnRTY3JvbGxPblN3aXBlICYmXG4gICAgICAgICAgICAgICAgcHJvcHMudHJhY2tUb3VjaCAmJlxuICAgICAgICAgICAgICAgIGV2ZW50LmNhbmNlbGFibGUpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCB7IFxuICAgICAgICAgICAgICAgIC8vIGZpcnN0IGlzIG5vdyBhbHdheXMgZmFsc2VcbiAgICAgICAgICAgICAgICBmaXJzdDogZmFsc2UsIGV2ZW50RGF0YSwgc3dpcGluZzogdHJ1ZSB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBvbkVuZCA9IChldmVudCkgPT4ge1xuICAgICAgICBzZXQoKHN0YXRlLCBwcm9wcykgPT4ge1xuICAgICAgICAgICAgbGV0IGV2ZW50RGF0YTtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5zd2lwaW5nICYmIHN0YXRlLmV2ZW50RGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHN3aXBlIGlzIGxlc3MgdGhhbiBkdXJhdGlvbiBmaXJlIHN3aXBlZCBjYWxsYmFja3NcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGltZVN0YW1wIC0gc3RhdGUuc3RhcnQgPCBwcm9wcy5zd2lwZUR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50RGF0YSA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuZXZlbnREYXRhKSwgeyBldmVudCB9KTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHMub25Td2lwZWQgJiYgcHJvcHMub25Td2lwZWQoZXZlbnREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb25Td2lwZWREaXIgPSBwcm9wc1tgb25Td2lwZWQke2V2ZW50RGF0YS5kaXJ9YF07XG4gICAgICAgICAgICAgICAgICAgIG9uU3dpcGVkRGlyICYmIG9uU3dpcGVkRGlyKGV2ZW50RGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvcHMub25UYXAgJiYgcHJvcHMub25UYXAoeyBldmVudCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByb3BzLm9uVG91Y2hFbmRPck9uTW91c2VVcCAmJiBwcm9wcy5vblRvdWNoRW5kT3JPbk1vdXNlVXAoeyBldmVudCB9KTtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCBpbml0aWFsU3RhdGUpLCB7IGV2ZW50RGF0YSB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBjbGVhblVwTW91c2UgPSAoKSA9PiB7XG4gICAgICAgIC8vIHNhZmUgdG8ganVzdCBjYWxsIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihtb3VzZU1vdmUsIG9uTW92ZSk7XG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIobW91c2VVcCwgb25VcCk7XG4gICAgfTtcbiAgICBjb25zdCBvblVwID0gKGUpID0+IHtcbiAgICAgICAgY2xlYW5VcE1vdXNlKCk7XG4gICAgICAgIG9uRW5kKGUpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogVGhlIHZhbHVlIG9mIHBhc3NpdmUgb24gdG91Y2hNb3ZlIGRlcGVuZHMgb24gYHByZXZlbnRTY3JvbGxPblN3aXBlYDpcbiAgICAgKiAtIHRydWUgPT4geyBwYXNzaXZlOiBmYWxzZSB9XG4gICAgICogLSBmYWxzZSA9PiB7IHBhc3NpdmU6IHRydWUgfSAvLyBEZWZhdWx0XG4gICAgICpcbiAgICAgKiBOT1RFOiBXaGVuIHByZXZlbnRTY3JvbGxPblN3aXBlIGlzIHRydWUsIHdlIGF0dGVtcHQgdG8gY2FsbCBwcmV2ZW50RGVmYXVsdCB0byBwcmV2ZW50IHNjcm9sbC5cbiAgICAgKlxuICAgICAqIHByb3BzLnRvdWNoRXZlbnRPcHRpb25zIGNhbiBhbHNvIGJlIHNldCBmb3IgYWxsIHRvdWNoIGV2ZW50IGxpc3RlbmVycyxcbiAgICAgKiBidXQgZm9yIGB0b3VjaG1vdmVgIHNwZWNpZmljYWxseSB3aGVuIGBwcmV2ZW50U2Nyb2xsT25Td2lwZWAgaXQgd2lsbFxuICAgICAqIHN1cGVyc2VkZSBhbmQgZm9yY2UgcGFzc2l2ZSB0byBmYWxzZS5cbiAgICAgKlxuICAgICAqL1xuICAgIGNvbnN0IGF0dGFjaFRvdWNoID0gKGVsLCBwcm9wcykgPT4ge1xuICAgICAgICBsZXQgY2xlYW51cCA9ICgpID0+IHsgfTtcbiAgICAgICAgaWYgKGVsICYmIGVsLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGJhc2VPcHRpb25zID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0UHJvcHMudG91Y2hFdmVudE9wdGlvbnMpLCBwcm9wcy50b3VjaEV2ZW50T3B0aW9ucyk7XG4gICAgICAgICAgICAvLyBhdHRhY2ggdG91Y2ggZXZlbnQgbGlzdGVuZXJzIGFuZCBoYW5kbGVyc1xuICAgICAgICAgICAgY29uc3QgdGxzID0gW1xuICAgICAgICAgICAgICAgIFt0b3VjaFN0YXJ0LCBvblN0YXJ0LCBiYXNlT3B0aW9uc10sXG4gICAgICAgICAgICAgICAgLy8gcHJldmVudFNjcm9sbE9uU3dpcGUgb3B0aW9uIHN1cGVyc2VkZXMgdG91Y2hFdmVudE9wdGlvbnMucGFzc2l2ZVxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgdG91Y2hNb3ZlLFxuICAgICAgICAgICAgICAgICAgICBvbk1vdmUsXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgYmFzZU9wdGlvbnMpLCAocHJvcHMucHJldmVudFNjcm9sbE9uU3dpcGUgPyB7IHBhc3NpdmU6IGZhbHNlIH0gOiB7fSkpLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgW3RvdWNoRW5kLCBvbkVuZCwgYmFzZU9wdGlvbnNdLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHRscy5mb3JFYWNoKChbZSwgaCwgb10pID0+IGVsLmFkZEV2ZW50TGlzdGVuZXIoZSwgaCwgbykpO1xuICAgICAgICAgICAgLy8gcmV0dXJuIHByb3Blcmx5IHNjb3BlZCBjbGVhbnVwIG1ldGhvZCBmb3IgcmVtb3ZpbmcgbGlzdGVuZXJzLCBvcHRpb25zIG5vdCByZXF1aXJlZFxuICAgICAgICAgICAgY2xlYW51cCA9ICgpID0+IHRscy5mb3JFYWNoKChbZSwgaF0pID0+IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZSwgaCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbGVhbnVwO1xuICAgIH07XG4gICAgY29uc3Qgb25SZWYgPSAoZWwpID0+IHtcbiAgICAgICAgLy8gXCJpbmxpbmVcIiByZWYgZnVuY3Rpb25zIGFyZSBjYWxsZWQgdHdpY2Ugb24gcmVuZGVyLCBvbmNlIHdpdGggbnVsbCB0aGVuIGFnYWluIHdpdGggRE9NIGVsZW1lbnRcbiAgICAgICAgLy8gaWdub3JlIG51bGwgaGVyZVxuICAgICAgICBpZiAoZWwgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHNldCgoc3RhdGUsIHByb3BzKSA9PiB7XG4gICAgICAgICAgICAvLyBpZiB0aGUgc2FtZSBET00gZWwgYXMgcHJldmlvdXMganVzdCByZXR1cm4gc3RhdGVcbiAgICAgICAgICAgIGlmIChzdGF0ZS5lbCA9PT0gZWwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICAgICAgY29uc3QgYWRkU3RhdGUgPSB7fTtcbiAgICAgICAgICAgIC8vIGlmIG5ldyBET00gZWwgY2xlYW4gdXAgb2xkIERPTSBhbmQgcmVzZXQgY2xlYW5VcFRvdWNoXG4gICAgICAgICAgICBpZiAoc3RhdGUuZWwgJiYgc3RhdGUuZWwgIT09IGVsICYmIHN0YXRlLmNsZWFuVXBUb3VjaCkge1xuICAgICAgICAgICAgICAgIHN0YXRlLmNsZWFuVXBUb3VjaCgpO1xuICAgICAgICAgICAgICAgIGFkZFN0YXRlLmNsZWFuVXBUb3VjaCA9IHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIG9ubHkgYXR0YWNoIGlmIHdlIHdhbnQgdG8gdHJhY2sgdG91Y2hcbiAgICAgICAgICAgIGlmIChwcm9wcy50cmFja1RvdWNoICYmIGVsKSB7XG4gICAgICAgICAgICAgICAgYWRkU3RhdGUuY2xlYW5VcFRvdWNoID0gYXR0YWNoVG91Y2goZWwsIHByb3BzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHN0b3JlIGV2ZW50IGF0dGFjaGVkIERPTSBlbCBmb3IgY29tcGFyaXNvbiwgY2xlYW4gdXAsIGFuZCByZS1hdHRhY2htZW50XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKSwgeyBlbCB9KSwgYWRkU3RhdGUpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIC8vIHNldCByZWYgY2FsbGJhY2sgdG8gYXR0YWNoIHRvdWNoIGV2ZW50IGxpc3RlbmVyc1xuICAgIGNvbnN0IG91dHB1dCA9IHtcbiAgICAgICAgcmVmOiBvblJlZixcbiAgICB9O1xuICAgIC8vIGlmIHRyYWNrIG1vdXNlIGF0dGFjaCBtb3VzZSBkb3duIGxpc3RlbmVyXG4gICAgaWYgKGhhbmRsZXJQcm9wcy50cmFja01vdXNlKSB7XG4gICAgICAgIG91dHB1dC5vbk1vdXNlRG93biA9IG9uU3RhcnQ7XG4gICAgfVxuICAgIHJldHVybiBbb3V0cHV0LCBhdHRhY2hUb3VjaF07XG59XG5mdW5jdGlvbiB1cGRhdGVUcmFuc2llbnRTdGF0ZShzdGF0ZSwgcHJvcHMsIHByZXZpb3VzUHJvcHMsIGF0dGFjaFRvdWNoKSB7XG4gICAgLy8gaWYgdHJhY2tUb3VjaCBpcyBvZmYgb3IgdGhlcmUgaXMgbm8gZWwsIHRoZW4gcmVtb3ZlIGhhbmRsZXJzIGlmIG5lY2Vzc2FyeSBhbmQgZXhpdFxuICAgIGlmICghcHJvcHMudHJhY2tUb3VjaCB8fCAhc3RhdGUuZWwpIHtcbiAgICAgICAgaWYgKHN0YXRlLmNsZWFuVXBUb3VjaCkge1xuICAgICAgICAgICAgc3RhdGUuY2xlYW5VcFRvdWNoKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCB7IGNsZWFuVXBUb3VjaDogdW5kZWZpbmVkIH0pO1xuICAgIH1cbiAgICAvLyB0cmFja1RvdWNoIGlzIG9uLCBzbyBpZiB0aGVyZSBhcmUgbm8gaGFuZGxlcnMgYXR0YWNoZWQsIGF0dGFjaCB0aGVtIGFuZCBleGl0XG4gICAgaWYgKCFzdGF0ZS5jbGVhblVwVG91Y2gpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCB7IGNsZWFuVXBUb3VjaDogYXR0YWNoVG91Y2goc3RhdGUuZWwsIHByb3BzKSB9KTtcbiAgICB9XG4gICAgLy8gdHJhY2tUb3VjaCBpcyBvbiBhbmQgaGFuZGxlcnMgYXJlIGFscmVhZHkgYXR0YWNoZWQsIHNvIGlmIHByZXZlbnRTY3JvbGxPblN3aXBlIGNoYW5nZXMgdmFsdWUsXG4gICAgLy8gcmVtb3ZlIGFuZCByZWF0dGFjaCBoYW5kbGVycyAodGhpcyBpcyByZXF1aXJlZCB0byB1cGRhdGUgdGhlIHBhc3NpdmUgb3B0aW9uIHdoZW4gYXR0YWNoaW5nXG4gICAgLy8gdGhlIGhhbmRsZXJzKVxuICAgIGlmIChwcm9wcy5wcmV2ZW50U2Nyb2xsT25Td2lwZSAhPT0gcHJldmlvdXNQcm9wcy5wcmV2ZW50U2Nyb2xsT25Td2lwZSB8fFxuICAgICAgICBwcm9wcy50b3VjaEV2ZW50T3B0aW9ucy5wYXNzaXZlICE9PSBwcmV2aW91c1Byb3BzLnRvdWNoRXZlbnRPcHRpb25zLnBhc3NpdmUpIHtcbiAgICAgICAgc3RhdGUuY2xlYW5VcFRvdWNoKCk7XG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKSwgeyBjbGVhblVwVG91Y2g6IGF0dGFjaFRvdWNoKHN0YXRlLmVsLCBwcm9wcykgfSk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZTtcbn1cbmZ1bmN0aW9uIHVzZVN3aXBlYWJsZShvcHRpb25zKSB7XG4gICAgY29uc3QgeyB0cmFja01vdXNlIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IHRyYW5zaWVudFN0YXRlID0gUmVhY3QudXNlUmVmKE9iamVjdC5hc3NpZ24oe30sIGluaXRpYWxTdGF0ZSkpO1xuICAgIGNvbnN0IHRyYW5zaWVudFByb3BzID0gUmVhY3QudXNlUmVmKE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRQcm9wcykpO1xuICAgIC8vIHRyYWNrIHByZXZpb3VzIHJlbmRlcmVkIHByb3BzXG4gICAgY29uc3QgcHJldmlvdXNQcm9wcyA9IFJlYWN0LnVzZVJlZihPYmplY3QuYXNzaWduKHt9LCB0cmFuc2llbnRQcm9wcy5jdXJyZW50KSk7XG4gICAgcHJldmlvdXNQcm9wcy5jdXJyZW50ID0gT2JqZWN0LmFzc2lnbih7fSwgdHJhbnNpZW50UHJvcHMuY3VycmVudCk7XG4gICAgLy8gdXBkYXRlIGN1cnJlbnQgcmVuZGVyIHByb3BzICYgZGVmYXVsdHNcbiAgICB0cmFuc2llbnRQcm9wcy5jdXJyZW50ID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0UHJvcHMpLCBvcHRpb25zKTtcbiAgICAvLyBGb3JjZSBkZWZhdWx0cyBmb3IgY29uZmlnIHByb3BlcnRpZXNcbiAgICBsZXQgZGVmYXVsdEtleTtcbiAgICBmb3IgKGRlZmF1bHRLZXkgaW4gZGVmYXVsdFByb3BzKSB7XG4gICAgICAgIGlmICh0cmFuc2llbnRQcm9wcy5jdXJyZW50W2RlZmF1bHRLZXldID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgIHRyYW5zaWVudFByb3BzLmN1cnJlbnRbZGVmYXVsdEtleV0gPSBkZWZhdWx0UHJvcHNbZGVmYXVsdEtleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgW2hhbmRsZXJzLCBhdHRhY2hUb3VjaF0gPSBSZWFjdC51c2VNZW1vKCgpID0+IGdldEhhbmRsZXJzKChzdGF0ZVNldHRlcikgPT4gKHRyYW5zaWVudFN0YXRlLmN1cnJlbnQgPSBzdGF0ZVNldHRlcih0cmFuc2llbnRTdGF0ZS5jdXJyZW50LCB0cmFuc2llbnRQcm9wcy5jdXJyZW50KSksIHsgdHJhY2tNb3VzZSB9KSwgW3RyYWNrTW91c2VdKTtcbiAgICB0cmFuc2llbnRTdGF0ZS5jdXJyZW50ID0gdXBkYXRlVHJhbnNpZW50U3RhdGUodHJhbnNpZW50U3RhdGUuY3VycmVudCwgdHJhbnNpZW50UHJvcHMuY3VycmVudCwgcHJldmlvdXNQcm9wcy5jdXJyZW50LCBhdHRhY2hUb3VjaCk7XG4gICAgcmV0dXJuIGhhbmRsZXJzO1xufVxuXG5leHBvcnRzLkRPV04gPSBET1dOO1xuZXhwb3J0cy5MRUZUID0gTEVGVDtcbmV4cG9ydHMuUklHSFQgPSBSSUdIVDtcbmV4cG9ydHMuVVAgPSBVUDtcbmV4cG9ydHMudXNlU3dpcGVhYmxlID0gdXNlU3dpcGVhYmxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwXG4iLCJpbXBvcnQgeyBDdXJyZW50VXNlck5hdiwgQm94IH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5pbXBvcnQgeyB1c2VDdXJyZW50QWRtaW4gfSBmcm9tICdhZG1pbmpzJztcbmltcG9ydCB7IHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xubGV0IGN1cnJlbnRBZG1pblVzZXI7XG5sZXQgdG9nZ2xlcjtcbmNvbnN0IFRvcEJhciA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IFtjdXJyZW50QWRtaW4sIHNldEN1cnJlbnRBZG1pbl0gPSB1c2VDdXJyZW50QWRtaW4oKTtcbiAgICBjb25zdCB7IHRvZ2dsZVNpZGViYXIgfSA9IHByb3BzO1xuICAgIHRvZ2dsZXIgPSB0b2dnbGVTaWRlYmFyO1xuICAgIGNvbnN0IFtzZXNzaW9uLCBwYXRocywgdmVyc2lvbnNdID0gdXNlU2VsZWN0b3IoKHN0YXRlKSA9PiBbXG4gICAgICAgIHN0YXRlLnNlc3Npb24sXG4gICAgICAgIHN0YXRlLnBhdGhzLFxuICAgICAgICBzdGF0ZS52ZXJzaW9ucyxcbiAgICBdKTtcbiAgICBjdXJyZW50QWRtaW5Vc2VyID0gY3VycmVudEFkbWluO1xuICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChCb3gsIHsgYm9yZGVyOiAnMHB4JywgZmxleDogdHJ1ZSwgZmxleERpcmVjdGlvbjogJ3Jvdy1yZXZlcnNlJywgaGVpZ2h0OiAnbmF2YmFySGVpZ2h0Jywgc3R5bGU6IGN1cnJlbnRBZG1pbi50aGVtZSA9PSAnZGFyaycgPyB7IGJhY2tncm91bmRDb2xvcjogJyMyODFBNEYnLCBjb2xvcjogJ3doaXRlJywgYm9yZGVyOiAnMnB4IHNvbGlkIGJsYWNrJyB9IDogeyBiYWNrZ3JvdW5kQ29sb3I6ICd3aGl0ZScsIGNvbG9yOiAnIzBkMTMxOCcgfSB9LFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEN1cnJlbnRVc2VyTmF2LCB7IGRyb3BBY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpY29uOiAnTG9nT3V0JyxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdMb2cgb3V0JyxcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogJy9hZG1pbi9sb2dvdXQnLFxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiBub1JlZkNoZWNrKCkgeyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSwgbGluZUFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGljb246ICdBcnJvd1JpZ2h0JyxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdTaWRlYmFyJyxcbiAgICAgICAgICAgICAgICAgICAgb25DbGljazogdG9nZ2xlU2lkZWJhcixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWNvbjogJ0FsZXJ0Q2lyY2xlJyxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdIZWxwJyxcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogJ2h0dHBzOi8vZGlzY29yZC5nZy9GcnhYQUJ0RScsXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIG5vUmVmQ2hlY2soKSB7IH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSwgbmFtZTogY3VycmVudEFkbWluLm5hbWUsIHRpdGxlOiBjdXJyZW50QWRtaW4ucm9sZSwgYXZhdGFyVXJsOiAnL2Fzc2V0L2ZpbGVzLycgKyBjdXJyZW50QWRtaW4ubmFtZSArICcvJyArIGN1cnJlbnRBZG1pbi5yb2xlICsgJy5wbmcnIH0pKSk7XG59O1xuZXhwb3J0IHsgY3VycmVudEFkbWluVXNlciwgdG9nZ2xlciB9O1xuZXhwb3J0IGRlZmF1bHQgVG9wQmFyO1xuIiwiaW1wb3J0IHsgQm94LCBQbGFjZWhvbGRlciwgQmFkZ2UgfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgc3R5bGVkIH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbS9zdHlsZWQtY29tcG9uZW50cyc7XG5pbXBvcnQgeyBBcGlDbGllbnQsIHVzZUN1cnJlbnRBZG1pbiwgdXNlTm90aWNlIH0gZnJvbSAnYWRtaW5qcyc7XG5pbXBvcnQgeyB1c2VTd2lwZWFibGUgfSBmcm9tICdyZWFjdC1zd2lwZWFibGUnO1xuaW1wb3J0IHsgdG9nZ2xlciB9IGZyb20gJy4vbmF2YmFyJztcbmNvbnN0IGFwaSA9IG5ldyBBcGlDbGllbnQoKTtcbmNvbnN0IERhc2hib2FyZCA9ICgpID0+IHtcbiAgICBjb25zdCBbY3VycmVudEFkbWluLCBzZXRDdXJyZW50QWRtaW5dID0gdXNlQ3VycmVudEFkbWluKCk7XG4gICAgY29uc3QgW3RleHQsIHNldFRleHRdID0gdXNlU3RhdGUoJycpO1xuICAgIGNvbnN0IFtzdWJzY3JpcHRpb24sIHNldFN1YnNjcmlwdGlvbl0gPSB1c2VTdGF0ZSgnJyk7XG4gICAgY29uc3QgW3N0YXQsIHNldFN0YXRdID0gdXNlU3RhdGUoJycpO1xuICAgIGNvbnN0IFtsb2dzLCBzZXRMb2dzXSA9IHVzZVN0YXRlKCcnKTtcbiAgICBjb25zdCBbcGluZywgc2V0UGluZ10gPSB1c2VTdGF0ZSgnJyk7XG4gICAgY29uc3QgW3VzZXIsIHNldFVzZXJdID0gdXNlU3RhdGUoJycpO1xuICAgIGNvbnN0IGhhbmRsZXJzID0gdXNlU3dpcGVhYmxlKHtcbiAgICAgICAgb25Td2lwZWRSaWdodDogKCkgPT4gdG9nZ2xlcigpLFxuICAgICAgICBzd2lwZUR1cmF0aW9uOiA1MDAsXG4gICAgICAgIHByZXZlbnRTY3JvbGxPblN3aXBlOiB0cnVlLFxuICAgICAgICB0cmFja01vdXNlOiBmYWxzZVxuICAgIH0pO1xuICAgIGNvbnN0IGFkZE5vdGljZSA9IHVzZU5vdGljZSgpO1xuICAgIGNvbnN0IGhhbmRsZUNsaWNrID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfTtcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBhcGkuZ2V0RGFzaGJvYXJkKCkudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICBzZXRUZXh0KHJlcy5kYXRhLnRleHQpO1xuICAgICAgICAgICAgc2V0U3Vic2NyaXB0aW9uKHJlcy5kYXRhLnN1YnNjcmlwdGlvbl90eXBlLnN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICBzZXRTdGF0KHJlcy5kYXRhLnN0YXQuaXNBY3RpdmUpO1xuICAgICAgICAgICAgc2V0TG9ncyhyZXMuZGF0YS5sb2dzKTtcbiAgICAgICAgICAgIHNldFBpbmcocmVzLmRhdGEucGluZyk7XG4gICAgICAgICAgICBzZXRVc2VyKHJlcy5kYXRhLnVzZXIubmFtZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIGNvbnN0IENhcmQgPSBzdHlsZWQoQm94KSBgXG4gIGhlaWdodDogMTAwJTtcbiAgYDtcbiAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyAuLi5oYW5kbGVycywgc3R5bGU6IHsgYmFja2dyb3VuZENvbG9yOiAnIzFlMWUxZScgfSB9LFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJveCwgeyBjb2xvcjogY3VycmVudEFkbWluLnRoZW1lID09ICdkYXJrJyA/ICcnIDogXCJ3aGl0ZVwiLCBjbGFzc05hbWU6ICdoZWlnaHQnLCBzdHlsZTogY3VycmVudEFkbWluLnRoZW1lID09ICdkYXJrJyA/IHsgYmFja2dyb3VuZENvbG9yOiAnIzI4MUE0RicgfSA6IHsgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnIH0gfSxcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQ2FyZCwgeyBjb2xvcjogY3VycmVudEFkbWluLnRoZW1lID09ICdkYXJrJyA/ICcnIDogXCJ3aGl0ZVwiLCBzdHlsZTogY3VycmVudEFkbWluLnRoZW1lID09ICdkYXJrJyA/IHsgbWFyZ2luTGVmdDogJzEwcHgnLCBwYWRkaW5nVG9wOiAnMTBweCcgfSA6IHsgbWFyZ2luTGVmdDogJzEwcHgnLCBwYWRkaW5nVG9wOiAnMTBweCcgfSwgY2xhc3NOYW1lOiBcImFuZ3J5LWdyaWRcIiB9LFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBpZDogXCJpdGVtLTBcIiB9LFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmRcIiwgc3R5bGU6IGN1cnJlbnRBZG1pbi50aGVtZSA9PSAnZGFyaycgPyB7IGJhY2tncm91bmQ6ICcjMWUxZTFlJywgY29sb3I6ICd3aGl0ZScsIGJvcmRlcjogJzBweCBzb2xpZCAjYzNjNmNlJyB9IDogeyBiYWNrZ3JvdW5kOiAnI2Y3ZjdmNycsIGNvbG9yOiAnIzBkMTMxOCcsIGJvcmRlcjogJzJweCBzb2xpZCAjYzNjNmNlJyB9IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmQtZGV0YWlsc1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgeyBjbGFzc05hbWU6IFwidGV4dC10aXRsZVwiIH0sIFwiVXNlcm5hbWVcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJ0ZXh0LWJvZHlcIiB9LCB1c2VyPy5sZW5ndGggPyBSZWFjdC5jcmVhdGVFbGVtZW50KFwicHJlXCIsIG51bGwsIHVzZXIpIDogUmVhY3QuY3JlYXRlRWxlbWVudChQbGFjZWhvbGRlciwgeyBzdHlsZTogeyB3aWR0aDogMTAwLCBoZWlnaHQ6IDE0IH0gfSkpKSkpLFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBpZDogXCJpdGVtLTFcIiB9LFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmRcIiwgc3R5bGU6IGN1cnJlbnRBZG1pbi50aGVtZSA9PSAnZGFyaycgPyB7IGJhY2tncm91bmQ6ICcjMWUxZTFlJywgY29sb3I6ICd3aGl0ZScsIGJvcmRlcjogJzBweCBzb2xpZCAjYzNjNmNlJyB9IDogeyBiYWNrZ3JvdW5kOiAnI2Y3ZjdmNycsIGNvbG9yOiAnIzBkMTMxOCcsIGJvcmRlcjogJzJweCBzb2xpZCAjYzNjNmNlJyB9IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmQtZGV0YWlsc1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgeyBjbGFzc05hbWU6IFwidGV4dC10aXRsZVwiIH0sIFwiU3Vic2NyaXB0aW9uXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwidGV4dC1ib2R5XCIgfSwgc3Vic2NyaXB0aW9uPy5sZW5ndGggPyBSZWFjdC5jcmVhdGVFbGVtZW50KFwicHJlXCIsIG51bGwsIHN1YnNjcmlwdGlvbikgOiBSZWFjdC5jcmVhdGVFbGVtZW50KFBsYWNlaG9sZGVyLCB7IHN0eWxlOiB7IHdpZHRoOiAxMDAsIGhlaWdodDogMTQgfSB9KSkpKSksXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGlkOiBcIml0ZW0tMlwiIH0sXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwiY2FyZFwiLCBzdHlsZTogY3VycmVudEFkbWluLnRoZW1lID09ICdkYXJrJyA/IHsgYmFja2dyb3VuZDogJyMxZTFlMWUnLCBjb2xvcjogJ3doaXRlJywgYm9yZGVyOiAnMHB4IHNvbGlkICNjM2M2Y2UnIH0gOiB7IGJhY2tncm91bmQ6ICcjZjdmN2Y3JywgY29sb3I6ICcjMGQxMzE4JywgYm9yZGVyOiAnMnB4IHNvbGlkICNjM2M2Y2UnIH0gfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwiY2FyZC1kZXRhaWxzXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicFwiLCB7IGNsYXNzTmFtZTogXCJ0ZXh0LXRpdGxlXCIgfSwgXCJTdGF0dXNcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJ0ZXh0LWJvZHlcIiB9LCBzdGF0ID09ICdBY3RpdmUnID8gUmVhY3QuY3JlYXRlRWxlbWVudChcInByZVwiLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJhZGdlLCB7IHZhcmlhbnQ6IFwic3VjY2Vzc1wiIH0sIFwiQWN0aXZlXCIpKSA6IFJlYWN0LmNyZWF0ZUVsZW1lbnQoQmFkZ2UsIHsgdmFyaWFudDogXCJkYW5nZXJcIiB9LCBcIk9mZmxpbmVcIikpKSkpLFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBpZDogXCJpdGVtLTNcIiB9LFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiAnY2FyZCcsIHN0eWxlOiBjdXJyZW50QWRtaW4udGhlbWUgPT0gJ2RhcmsnID8geyBiYWNrZ3JvdW5kOiAnIzFlMWUxZScsIGNvbG9yOiAnd2hpdGUnLCBib3JkZXI6ICcwcHggc29saWQgI2MzYzZjZScgfSA6IHsgYmFja2dyb3VuZDogJyNmN2Y3ZjcnLCBjb2xvcjogJyMwZDEzMTgnLCBib3JkZXI6ICcycHggc29saWQgI2MzYzZjZScgfSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJjYXJkLWRldGFpbHNcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIHsgY2xhc3NOYW1lOiBcInRleHQtdGl0bGVcIiB9LCBcIkFubm91bmNlbWVudHNcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJ0ZXh0LWJvZHlcIiB9LCBwaW5nPy5sZW5ndGggPyBSZWFjdC5jcmVhdGVFbGVtZW50KFwicHJlXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaW5nWzBdLmFubm91bmNlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGF0IFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGluZ1swXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaW5nWzFdLmFubm91bmNlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGF0IFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGluZ1sxXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaW5nWzJdLmFubm91bmNlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGF0IFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGluZ1syXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSkpIDogUmVhY3QuY3JlYXRlRWxlbWVudChCYWRnZSwgeyB2YXJpYW50OiBcImRhbmdlclwiIH0sIFwiTm8gQW5ub3VuY2VtZW50c1wiKSkpKSksXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGlkOiBcIml0ZW0tNFwiIH0sXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6ICdjYXJkJywgc3R5bGU6IGN1cnJlbnRBZG1pbi50aGVtZSA9PSAnZGFyaycgPyB7IGJhY2tncm91bmQ6ICcjMWUxZTFlJywgY29sb3I6ICd3aGl0ZScsIGJvcmRlcjogJzBweCBzb2xpZCAjYzNjNmNlJyB9IDogeyBiYWNrZ3JvdW5kOiAnI2Y3ZjdmNycsIGNvbG9yOiAnIzBkMTMxOCcsIGJvcmRlcjogJzJweCBzb2xpZCAjYzNjNmNlJyB9IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmQtZGV0YWlsc1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgeyBjbGFzc05hbWU6IFwidGV4dC10aXRsZVwiIH0sIFwiQW50aSBFeHBsb2l0XCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIHsgY2xhc3NOYW1lOiAndGV4dC1ib2R5JyB9LCBcIkxvcmVtIGlwc3VtIHNpdCBkb2xvciBhbWV0IGxvcmVtIGlwc3VtXCIpKSkpLFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBpZDogXCJpdGVtLTVcIiB9LFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiAnY2FyZCBkYWlseScsIHN0eWxlOiBjdXJyZW50QWRtaW4udGhlbWUgPT0gJ2RhcmsnID8geyBiYWNrZ3JvdW5kOiAnIzFlMWUxZScsIGNvbG9yOiAnd2hpdGUnLCBib3JkZXI6ICcwcHggc29saWQgI2MzYzZjZScgfSA6IHsgYmFja2dyb3VuZDogJyNmN2Y3ZjcnLCBjb2xvcjogJyMwZDEzMTgnLCBib3JkZXI6ICcycHggc29saWQgI2MzYzZjZScgfSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJjYXJkLWRldGFpbHNcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIHsgY2xhc3NOYW1lOiBcInRleHQtdGl0bGVcIiB9LCBcIkRhaWx5XCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwidGV4dC1ib2R5XCIgfSwgbG9ncz8ubGVuZ3RoID8gUmVhY3QuY3JlYXRlRWxlbWVudChcInByZVwiLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicFwiLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nc1swXS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGF0IFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nc1swXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dzWzFdLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgYXQgXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dzWzFdLmNyZWF0ZWRBdC5zcGxpdCgnVCcpWzBdKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ3NbMl0uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBhdCBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ3NbMl0uY3JlYXRlZEF0LnNwbGl0KCdUJylbMF0pKSA6IFJlYWN0LmNyZWF0ZUVsZW1lbnQoQmFkZ2UsIHsgdmFyaWFudDogXCJkYW5nZXJcIiB9LCBcIk5vIExvZ3NcIikpKSkpKSksXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJmb290ZXJcIiwgeyBjbGFzc05hbWU6ICdmb290ZXItY29udGVudCcsIHN0eWxlOiBjdXJyZW50QWRtaW4udGhlbWUgPT0gJ2RhcmsnID8geyBiYWNrZ3JvdW5kQ29sb3I6ICcjMjgxQTRGJywgY29sb3I6ICd3aGl0ZScgfSA6IHsgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnLCBjb2xvcjogJyMwZDEzMTgnIH0gfSxcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgbnVsbCwgXCJBc3BlY3QgU3lzdGVtcyB8IEFsbCByaWdodHMgcmVzZXJ2ZWQuXCIpKSkpO1xufTtcbmV4cG9ydCBkZWZhdWx0IERhc2hib2FyZDtcbiIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBCb3ggfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCB7IFZpZXdIZWxwZXJzLCB1c2VDdXJyZW50QWRtaW4gfSBmcm9tICdhZG1pbmpzJztcbmNvbnN0IGggPSBuZXcgVmlld0hlbHBlcnMoKTtcbmNvbnN0IFNpZGViYXJCcmFuZGluZyA9ICgpID0+IHtcbiAgICBjb25zdCBbY3VycmVudEFkbWluLCBzZXRDdXJyZW50QWRtaW5dID0gdXNlQ3VycmVudEFkbWluKCk7XG4gICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KEJveCwgeyBmbGV4OiB0cnVlLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIiwgcHk6IFwieGxcIiwgc3R5bGU6IGN1cnJlbnRBZG1pbi50aGVtZSA9PSAnZGFyaycgPyB7IGJhY2tncm91bmRDb2xvcjogJ2JsYWNrJyB9IDogeyBiYWNrZ3JvdW5kQ29sb3I6ICd3aGl0ZScgfSB9LFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYVwiLCB7IGhyZWY6IGguZGFzaGJvYXJkVXJsKCkgfSxcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIiwgeyBzcmM6ICcvYXNzZXQvbG9nb3R5cGUucG5nJywgYWx0OiAnQXNwZWN0IHwgSW5zdGVwJyB9KSkpKTtcbn07XG5leHBvcnQgZGVmYXVsdCBTaWRlYmFyQnJhbmRpbmc7XG4iLCJpbXBvcnQgeyBEcm9wWm9uZSwgRHJvcFpvbmVJdGVtLCBGb3JtR3JvdXAsIExhYmVsIH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5pbXBvcnQgeyBmbGF0IH0gZnJvbSAnYWRtaW5qcyc7XG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmNvbnN0IEVkaXQgPSAoeyBwcm9wZXJ0eSwgcmVjb3JkLCBvbkNoYW5nZSB9KSA9PiB7XG4gICAgY29uc3QgeyBwYXJhbXMgfSA9IHJlY29yZDtcbiAgICBjb25zdCB7IGN1c3RvbSB9ID0gcHJvcGVydHk7XG4gICAgY29uc3QgcGF0aCA9IGZsYXQuZ2V0KHBhcmFtcywgY3VzdG9tLmZpbGVQYXRoUHJvcGVydHkpO1xuICAgIGNvbnN0IGtleSA9IGZsYXQuZ2V0KHBhcmFtcywgY3VzdG9tLmtleVByb3BlcnR5KTtcbiAgICBjb25zdCBmaWxlID0gZmxhdC5nZXQocGFyYW1zLCBjdXN0b20uZmlsZVByb3BlcnR5KTtcbiAgICBjb25zdCBbb3JpZ2luYWxLZXksIHNldE9yaWdpbmFsS2V5XSA9IHVzZVN0YXRlKGtleSk7XG4gICAgY29uc3QgW2ZpbGVzVG9VcGxvYWQsIHNldEZpbGVzVG9VcGxvYWRdID0gdXNlU3RhdGUoW10pO1xuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIC8vIGl0IG1lYW5zIG1lYW5zIHRoYXQgc29tZW9uZSBoaXQgc2F2ZSBhbmQgbmV3IGZpbGUgaGFzIGJlZW4gdXBsb2FkZWRcbiAgICAgICAgLy8gaW4gdGhpcyBjYXNlIGZsaWVzVG9VcGxvYWQgc2hvdWxkIGJlIGNsZWFyZWQuXG4gICAgICAgIC8vIFRoaXMgaGFwcGVucyB3aGVuIHVzZXIgdHVybnMgb2ZmIHJlZGlyZWN0IGFmdGVyIG5ldy9lZGl0XG4gICAgICAgIGlmICgodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYga2V5ICE9PSBvcmlnaW5hbEtleSlcbiAgICAgICAgICAgIHx8ICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyAmJiAhb3JpZ2luYWxLZXkpXG4gICAgICAgICAgICB8fCAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycgJiYgQXJyYXkuaXNBcnJheShrZXkpICYmIGtleS5sZW5ndGggIT09IG9yaWdpbmFsS2V5Lmxlbmd0aCkpIHtcbiAgICAgICAgICAgIHNldE9yaWdpbmFsS2V5KGtleSk7XG4gICAgICAgICAgICBzZXRGaWxlc1RvVXBsb2FkKFtdKTtcbiAgICAgICAgfVxuICAgIH0sIFtrZXksIG9yaWdpbmFsS2V5XSk7XG4gICAgY29uc3Qgb25VcGxvYWQgPSAoZmlsZXMpID0+IHtcbiAgICAgICAgc2V0RmlsZXNUb1VwbG9hZChmaWxlcyk7XG4gICAgICAgIG9uQ2hhbmdlKGN1c3RvbS5maWxlUHJvcGVydHksIGZpbGVzKTtcbiAgICB9O1xuICAgIGNvbnN0IGhhbmRsZVJlbW92ZSA9ICgpID0+IHtcbiAgICAgICAgb25DaGFuZ2UoY3VzdG9tLmZpbGVQcm9wZXJ0eSwgbnVsbCk7XG4gICAgfTtcbiAgICBjb25zdCBoYW5kbGVNdWx0aVJlbW92ZSA9IChzaW5nbGVLZXkpID0+IHtcbiAgICAgICAgY29uc3QgaW5kZXggPSAoZmxhdC5nZXQocmVjb3JkLnBhcmFtcywgY3VzdG9tLmtleVByb3BlcnR5KSB8fCBbXSkuaW5kZXhPZihzaW5nbGVLZXkpO1xuICAgICAgICBjb25zdCBmaWxlc1RvRGVsZXRlID0gZmxhdC5nZXQocmVjb3JkLnBhcmFtcywgY3VzdG9tLmZpbGVzVG9EZWxldGVQcm9wZXJ0eSkgfHwgW107XG4gICAgICAgIGlmIChwYXRoICYmIHBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbmV3UGF0aCA9IHBhdGgubWFwKChjdXJyZW50UGF0aCwgaSkgPT4gKGkgIT09IGluZGV4ID8gY3VycmVudFBhdGggOiBudWxsKSk7XG4gICAgICAgICAgICBsZXQgbmV3UGFyYW1zID0gZmxhdC5zZXQocmVjb3JkLnBhcmFtcywgY3VzdG9tLmZpbGVzVG9EZWxldGVQcm9wZXJ0eSwgWy4uLmZpbGVzVG9EZWxldGUsIGluZGV4XSk7XG4gICAgICAgICAgICBuZXdQYXJhbXMgPSBmbGF0LnNldChuZXdQYXJhbXMsIGN1c3RvbS5maWxlUGF0aFByb3BlcnR5LCBuZXdQYXRoKTtcbiAgICAgICAgICAgIG9uQ2hhbmdlKHtcbiAgICAgICAgICAgICAgICAuLi5yZWNvcmQsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBuZXdQYXJhbXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnWW91IGNhbm5vdCByZW1vdmUgZmlsZSB3aGVuIHRoZXJlIGFyZSBubyB1cGxvYWRlZCBmaWxlcyB5ZXQnKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KEZvcm1Hcm91cCwgbnVsbCxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChMYWJlbCwgbnVsbCwgcHJvcGVydHkubGFiZWwpLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KERyb3Bab25lLCB7IG9uQ2hhbmdlOiBvblVwbG9hZCwgbXVsdGlwbGU6IGN1c3RvbS5tdWx0aXBsZSwgdmFsaWRhdGU6IHtcbiAgICAgICAgICAgICAgICBtaW1lVHlwZXM6IGN1c3RvbS5taW1lVHlwZXMsXG4gICAgICAgICAgICAgICAgbWF4U2l6ZTogY3VzdG9tLm1heFNpemUsXG4gICAgICAgICAgICB9LCBmaWxlczogZmlsZXNUb1VwbG9hZCB9KSxcbiAgICAgICAgIWN1c3RvbS5tdWx0aXBsZSAmJiBrZXkgJiYgcGF0aCAmJiAhZmlsZXNUb1VwbG9hZC5sZW5ndGggJiYgZmlsZSAhPT0gbnVsbCAmJiAoUmVhY3QuY3JlYXRlRWxlbWVudChEcm9wWm9uZUl0ZW0sIHsgZmlsZW5hbWU6IGtleSwgc3JjOiBwYXRoLCBvblJlbW92ZTogaGFuZGxlUmVtb3ZlIH0pKSxcbiAgICAgICAgY3VzdG9tLm11bHRpcGxlICYmIGtleSAmJiBrZXkubGVuZ3RoICYmIHBhdGggPyAoUmVhY3QuY3JlYXRlRWxlbWVudChSZWFjdC5GcmFnbWVudCwgbnVsbCwga2V5Lm1hcCgoc2luZ2xlS2V5LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgLy8gd2hlbiB3ZSByZW1vdmUgaXRlbXMgd2Ugc2V0IG9ubHkgcGF0aCBpbmRleCB0byBudWxscy5cbiAgICAgICAgICAgIC8vIGtleSBpcyBzdGlsbCB0aGVyZS4gVGhpcyBpcyBiZWNhdXNlXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIHRvIG1haW50YWluIGFsbCB0aGUgaW5kZXhlcy4gU28gaGVyZSB3ZSBzaW1wbHkgZmlsdGVyIG91dCBlbGVtZW50cyB3aGljaFxuICAgICAgICAgICAgLy8gd2VyZSByZW1vdmVkIGFuZCBkaXNwbGF5IG9ubHkgd2hhdCB3YXMgbGVmdFxuICAgICAgICAgICAgY29uc3QgY3VycmVudFBhdGggPSBwYXRoW2luZGV4XTtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50UGF0aCA/IChSZWFjdC5jcmVhdGVFbGVtZW50KERyb3Bab25lSXRlbSwgeyBrZXk6IHNpbmdsZUtleSwgZmlsZW5hbWU6IHNpbmdsZUtleSwgc3JjOiBwYXRoW2luZGV4XSwgb25SZW1vdmU6ICgpID0+IGhhbmRsZU11bHRpUmVtb3ZlKHNpbmdsZUtleSkgfSkpIDogJyc7XG4gICAgICAgIH0pKSkgOiAnJykpO1xufTtcbmV4cG9ydCBkZWZhdWx0IEVkaXQ7XG4iLCJleHBvcnQgY29uc3QgQXVkaW9NaW1lVHlwZXMgPSBbXG4gICAgJ2F1ZGlvL2FhYycsXG4gICAgJ2F1ZGlvL21pZGknLFxuICAgICdhdWRpby94LW1pZGknLFxuICAgICdhdWRpby9tcGVnJyxcbiAgICAnYXVkaW8vb2dnJyxcbiAgICAnYXBwbGljYXRpb24vb2dnJyxcbiAgICAnYXVkaW8vb3B1cycsXG4gICAgJ2F1ZGlvL3dhdicsXG4gICAgJ2F1ZGlvL3dlYm0nLFxuICAgICdhdWRpby8zZ3BwMicsXG5dO1xuZXhwb3J0IGNvbnN0IFZpZGVvTWltZVR5cGVzID0gW1xuICAgICd2aWRlby94LW1zdmlkZW8nLFxuICAgICd2aWRlby9tcGVnJyxcbiAgICAndmlkZW8vb2dnJyxcbiAgICAndmlkZW8vbXAydCcsXG4gICAgJ3ZpZGVvL3dlYm0nLFxuICAgICd2aWRlby8zZ3BwJyxcbiAgICAndmlkZW8vM2dwcDInLFxuXTtcbmV4cG9ydCBjb25zdCBJbWFnZU1pbWVUeXBlcyA9IFtcbiAgICAnaW1hZ2UvYm1wJyxcbiAgICAnaW1hZ2UvZ2lmJyxcbiAgICAnaW1hZ2UvanBlZycsXG4gICAgJ2ltYWdlL3BuZycsXG4gICAgJ2ltYWdlL3N2Zyt4bWwnLFxuICAgICdpbWFnZS92bmQubWljcm9zb2Z0Lmljb24nLFxuICAgICdpbWFnZS90aWZmJyxcbiAgICAnaW1hZ2Uvd2VicCcsXG5dO1xuZXhwb3J0IGNvbnN0IENvbXByZXNzZWRNaW1lVHlwZXMgPSBbXG4gICAgJ2FwcGxpY2F0aW9uL3gtYnppcCcsXG4gICAgJ2FwcGxpY2F0aW9uL3gtYnppcDInLFxuICAgICdhcHBsaWNhdGlvbi9nemlwJyxcbiAgICAnYXBwbGljYXRpb24vamF2YS1hcmNoaXZlJyxcbiAgICAnYXBwbGljYXRpb24veC10YXInLFxuICAgICdhcHBsaWNhdGlvbi96aXAnLFxuICAgICdhcHBsaWNhdGlvbi94LTd6LWNvbXByZXNzZWQnLFxuXTtcbmV4cG9ydCBjb25zdCBEb2N1bWVudE1pbWVUeXBlcyA9IFtcbiAgICAnYXBwbGljYXRpb24veC1hYml3b3JkJyxcbiAgICAnYXBwbGljYXRpb24veC1mcmVlYXJjJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLmFtYXpvbi5lYm9vaycsXG4gICAgJ2FwcGxpY2F0aW9uL21zd29yZCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50JyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm1zLWZvbnRvYmplY3QnLFxuICAgICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnByZXNlbnRhdGlvbicsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuc3ByZWFkc2hlZXQnLFxuICAgICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHQnLFxuICAgICdhcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC5wcmVzZW50YXRpb24nLFxuICAgICdhcHBsaWNhdGlvbi92bmQucmFyJyxcbiAgICAnYXBwbGljYXRpb24vcnRmJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXQnLFxuXTtcbmV4cG9ydCBjb25zdCBUZXh0TWltZVR5cGVzID0gW1xuICAgICd0ZXh0L2NzcycsXG4gICAgJ3RleHQvY3N2JyxcbiAgICAndGV4dC9odG1sJyxcbiAgICAndGV4dC9jYWxlbmRhcicsXG4gICAgJ3RleHQvamF2YXNjcmlwdCcsXG4gICAgJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICdhcHBsaWNhdGlvbi9sZCtqc29uJyxcbiAgICAndGV4dC9qYXZhc2NyaXB0JyxcbiAgICAndGV4dC9wbGFpbicsXG4gICAgJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcsXG4gICAgJ2FwcGxpY2F0aW9uL3htbCcsXG4gICAgJ3RleHQveG1sJyxcbl07XG5leHBvcnQgY29uc3QgQmluYXJ5RG9jc01pbWVUeXBlcyA9IFtcbiAgICAnYXBwbGljYXRpb24vZXB1Yit6aXAnLFxuICAgICdhcHBsaWNhdGlvbi9wZGYnLFxuXTtcbmV4cG9ydCBjb25zdCBGb250TWltZVR5cGVzID0gW1xuICAgICdmb250L290ZicsXG4gICAgJ2ZvbnQvdHRmJyxcbiAgICAnZm9udC93b2ZmJyxcbiAgICAnZm9udC93b2ZmMicsXG5dO1xuZXhwb3J0IGNvbnN0IE90aGVyTWltZVR5cGVzID0gW1xuICAgICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxuICAgICdhcHBsaWNhdGlvbi94LWNzaCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5hcHBsZS5pbnN0YWxsZXIreG1sJyxcbiAgICAnYXBwbGljYXRpb24veC1odHRwZC1waHAnLFxuICAgICdhcHBsaWNhdGlvbi94LXNoJyxcbiAgICAnYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2gnLFxuICAgICd2bmQudmlzaW8nLFxuICAgICdhcHBsaWNhdGlvbi92bmQubW96aWxsYS54dWwreG1sJyxcbl07XG5leHBvcnQgY29uc3QgTWltZVR5cGVzID0gW1xuICAgIC4uLkF1ZGlvTWltZVR5cGVzLFxuICAgIC4uLlZpZGVvTWltZVR5cGVzLFxuICAgIC4uLkltYWdlTWltZVR5cGVzLFxuICAgIC4uLkNvbXByZXNzZWRNaW1lVHlwZXMsXG4gICAgLi4uRG9jdW1lbnRNaW1lVHlwZXMsXG4gICAgLi4uVGV4dE1pbWVUeXBlcyxcbiAgICAuLi5CaW5hcnlEb2NzTWltZVR5cGVzLFxuICAgIC4uLk90aGVyTWltZVR5cGVzLFxuICAgIC4uLkZvbnRNaW1lVHlwZXMsXG4gICAgLi4uT3RoZXJNaW1lVHlwZXMsXG5dO1xuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llc1xuaW1wb3J0IHsgQm94LCBCdXR0b24sIEljb24gfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCB7IGZsYXQgfSBmcm9tICdhZG1pbmpzJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBBdWRpb01pbWVUeXBlcywgSW1hZ2VNaW1lVHlwZXMgfSBmcm9tICcuLi90eXBlcy9taW1lLXR5cGVzLnR5cGUuanMnO1xuY29uc3QgU2luZ2xlRmlsZSA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IHsgbmFtZSwgcGF0aCwgbWltZVR5cGUsIHdpZHRoIH0gPSBwcm9wcztcbiAgICBpZiAocGF0aCAmJiBwYXRoLmxlbmd0aCkge1xuICAgICAgICBpZiAobWltZVR5cGUgJiYgSW1hZ2VNaW1lVHlwZXMuaW5jbHVkZXMobWltZVR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIiwgeyBzcmM6IHBhdGgsIHN0eWxlOiB7IG1heEhlaWdodDogd2lkdGgsIG1heFdpZHRoOiB3aWR0aCB9LCBhbHQ6IG5hbWUgfSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtaW1lVHlwZSAmJiBBdWRpb01pbWVUeXBlcy5pbmNsdWRlcyhtaW1lVHlwZSkpIHtcbiAgICAgICAgICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIsIHsgY29udHJvbHM6IHRydWUsIHNyYzogcGF0aCB9LFxuICAgICAgICAgICAgICAgIFwiWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdGhlXCIsXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImNvZGVcIiwgbnVsbCwgXCJhdWRpb1wiKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwidHJhY2tcIiwgeyBraW5kOiBcImNhcHRpb25zXCIgfSkpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoQm94LCBudWxsLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJ1dHRvbiwgeyBhczogXCJhXCIsIGhyZWY6IHBhdGgsIG1sOiBcImRlZmF1bHRcIiwgc2l6ZTogXCJzbVwiLCByb3VuZGVkOiB0cnVlLCB0YXJnZXQ6IFwiX2JsYW5rXCIgfSxcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoSWNvbiwgeyBpY29uOiBcIkRvY3VtZW50RG93bmxvYWRcIiwgY29sb3I6IFwid2hpdGVcIiwgbXI6IFwiZGVmYXVsdFwiIH0pLFxuICAgICAgICAgICAgbmFtZSkpKTtcbn07XG5jb25zdCBGaWxlID0gKHsgd2lkdGgsIHJlY29yZCwgcHJvcGVydHkgfSkgPT4ge1xuICAgIGNvbnN0IHsgY3VzdG9tIH0gPSBwcm9wZXJ0eTtcbiAgICBsZXQgcGF0aCA9IGZsYXQuZ2V0KHJlY29yZD8ucGFyYW1zLCBjdXN0b20uZmlsZVBhdGhQcm9wZXJ0eSk7XG4gICAgaWYgKCFwYXRoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBuYW1lID0gZmxhdC5nZXQocmVjb3JkPy5wYXJhbXMsIGN1c3RvbS5maWxlTmFtZVByb3BlcnR5ID8gY3VzdG9tLmZpbGVOYW1lUHJvcGVydHkgOiBjdXN0b20ua2V5UHJvcGVydHkpO1xuICAgIGNvbnN0IG1pbWVUeXBlID0gY3VzdG9tLm1pbWVUeXBlUHJvcGVydHlcbiAgICAgICAgJiYgZmxhdC5nZXQocmVjb3JkPy5wYXJhbXMsIGN1c3RvbS5taW1lVHlwZVByb3BlcnR5KTtcbiAgICBpZiAoIXByb3BlcnR5LmN1c3RvbS5tdWx0aXBsZSkge1xuICAgICAgICBpZiAoY3VzdG9tLm9wdHMgJiYgY3VzdG9tLm9wdHMuYmFzZVVybCkge1xuICAgICAgICAgICAgcGF0aCA9IGAke2N1c3RvbS5vcHRzLmJhc2VVcmx9LyR7bmFtZX1gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChTaW5nbGVGaWxlLCB7IHBhdGg6IHBhdGgsIG5hbWU6IG5hbWUsIHdpZHRoOiB3aWR0aCwgbWltZVR5cGU6IG1pbWVUeXBlIH0pKTtcbiAgICB9XG4gICAgaWYgKGN1c3RvbS5vcHRzICYmIGN1c3RvbS5vcHRzLmJhc2VVcmwpIHtcbiAgICAgICAgY29uc3QgYmFzZVVybCA9IGN1c3RvbS5vcHRzLmJhc2VVcmwgfHwgJyc7XG4gICAgICAgIHBhdGggPSBwYXRoLm1hcCgoc2luZ2xlUGF0aCwgaW5kZXgpID0+IGAke2Jhc2VVcmx9LyR7bmFtZVtpbmRleF19YCk7XG4gICAgfVxuICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChSZWFjdC5GcmFnbWVudCwgbnVsbCwgcGF0aC5tYXAoKHNpbmdsZVBhdGgsIGluZGV4KSA9PiAoUmVhY3QuY3JlYXRlRWxlbWVudChTaW5nbGVGaWxlLCB7IGtleTogc2luZ2xlUGF0aCwgcGF0aDogc2luZ2xlUGF0aCwgbmFtZTogbmFtZVtpbmRleF0sIHdpZHRoOiB3aWR0aCwgbWltZVR5cGU6IG1pbWVUeXBlW2luZGV4XSB9KSkpKSk7XG59O1xuZXhwb3J0IGRlZmF1bHQgRmlsZTtcbiIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgRmlsZSBmcm9tICcuL2ZpbGUuanMnO1xuY29uc3QgTGlzdCA9IChwcm9wcykgPT4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmlsZSwgeyB3aWR0aDogMTAwLCAuLi5wcm9wcyB9KSk7XG5leHBvcnQgZGVmYXVsdCBMaXN0O1xuIiwiaW1wb3J0IHsgRm9ybUdyb3VwLCBMYWJlbCB9IGZyb20gJ0BhZG1pbmpzL2Rlc2lnbi1zeXN0ZW0nO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBGaWxlIGZyb20gJy4vZmlsZS5qcyc7XG5jb25zdCBTaG93ID0gKHByb3BzKSA9PiB7XG4gICAgY29uc3QgeyBwcm9wZXJ0eSB9ID0gcHJvcHM7XG4gICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KEZvcm1Hcm91cCwgbnVsbCxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChMYWJlbCwgbnVsbCwgcHJvcGVydHkubGFiZWwpLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZpbGUsIHsgd2lkdGg6IFwiMTAwJVwiLCAuLi5wcm9wcyB9KSkpO1xufTtcbmV4cG9ydCBkZWZhdWx0IFNob3c7XG4iLCJBZG1pbkpTLlVzZXJDb21wb25lbnRzID0ge31cbmltcG9ydCBEYXNoYm9hcmQgZnJvbSAnLi4vZGlzdC9jb21wb25lbnRzL215LWRhc2hib2FyZC1jb21wb25lbnQnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLkRhc2hib2FyZCA9IERhc2hib2FyZFxuaW1wb3J0IFRvcEJhciBmcm9tICcuLi9kaXN0L2NvbXBvbmVudHMvbmF2YmFyJ1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5Ub3BCYXIgPSBUb3BCYXJcbmltcG9ydCBTaWRlYmFyQnJhbmRpbmcgZnJvbSAnLi4vZGlzdC9jb21wb25lbnRzL1NpZGViYXJCcmFuZGluZydcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuU2lkZWJhckJyYW5kaW5nID0gU2lkZWJhckJyYW5kaW5nXG5pbXBvcnQgVXBsb2FkRWRpdENvbXBvbmVudCBmcm9tICcuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkRWRpdENvbXBvbmVudCdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuVXBsb2FkRWRpdENvbXBvbmVudCA9IFVwbG9hZEVkaXRDb21wb25lbnRcbmltcG9ydCBVcGxvYWRMaXN0Q29tcG9uZW50IGZyb20gJy4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRMaXN0Q29tcG9uZW50J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5VcGxvYWRMaXN0Q29tcG9uZW50ID0gVXBsb2FkTGlzdENvbXBvbmVudFxuaW1wb3J0IFVwbG9hZFNob3dDb21wb25lbnQgZnJvbSAnLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS9jb21wb25lbnRzL1VwbG9hZFNob3dDb21wb25lbnQnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLlVwbG9hZFNob3dDb21wb25lbnQgPSBVcGxvYWRTaG93Q29tcG9uZW50Il0sIm5hbWVzIjpbIlJlYWN0IiwicmVxdWlyZSQkMCIsInRvZ2dsZXIiLCJUb3BCYXIiLCJwcm9wcyIsImN1cnJlbnRBZG1pbiIsInNldEN1cnJlbnRBZG1pbiIsInVzZUN1cnJlbnRBZG1pbiIsInRvZ2dsZVNpZGViYXIiLCJ1c2VTZWxlY3RvciIsInN0YXRlIiwic2Vzc2lvbiIsInBhdGhzIiwidmVyc2lvbnMiLCJjcmVhdGVFbGVtZW50IiwiQm94IiwiYm9yZGVyIiwiZmxleCIsImZsZXhEaXJlY3Rpb24iLCJoZWlnaHQiLCJzdHlsZSIsInRoZW1lIiwiYmFja2dyb3VuZENvbG9yIiwiY29sb3IiLCJDdXJyZW50VXNlck5hdiIsImRyb3BBY3Rpb25zIiwiaWNvbiIsImxhYmVsIiwiaHJlZiIsIm9uQ2xpY2siLCJub1JlZkNoZWNrIiwibGluZUFjdGlvbnMiLCJuYW1lIiwidGl0bGUiLCJyb2xlIiwiYXZhdGFyVXJsIiwiYXBpIiwiQXBpQ2xpZW50IiwiRGFzaGJvYXJkIiwidGV4dCIsInNldFRleHQiLCJ1c2VTdGF0ZSIsInN1YnNjcmlwdGlvbiIsInNldFN1YnNjcmlwdGlvbiIsInN0YXQiLCJzZXRTdGF0IiwibG9ncyIsInNldExvZ3MiLCJwaW5nIiwic2V0UGluZyIsInVzZXIiLCJzZXRVc2VyIiwiaGFuZGxlcnMiLCJ1c2VTd2lwZWFibGUiLCJvblN3aXBlZFJpZ2h0Iiwic3dpcGVEdXJhdGlvbiIsInByZXZlbnRTY3JvbGxPblN3aXBlIiwidHJhY2tNb3VzZSIsInVzZU5vdGljZSIsInVzZUVmZmVjdCIsImdldERhc2hib2FyZCIsInRoZW4iLCJyZXMiLCJkYXRhIiwic3Vic2NyaXB0aW9uX3R5cGUiLCJpc0FjdGl2ZSIsIkNhcmQiLCJzdHlsZWQiLCJjbGFzc05hbWUiLCJtYXJnaW5MZWZ0IiwicGFkZGluZ1RvcCIsImlkIiwiYmFja2dyb3VuZCIsImxlbmd0aCIsIlBsYWNlaG9sZGVyIiwid2lkdGgiLCJCYWRnZSIsInZhcmlhbnQiLCJhbm5vdW5jZW1lbnQiLCJjcmVhdGVkQXQiLCJzcGxpdCIsImRlc2NyaXB0aW9uIiwiaCIsIlZpZXdIZWxwZXJzIiwiU2lkZWJhckJyYW5kaW5nIiwiYWxpZ25JdGVtcyIsImp1c3RpZnlDb250ZW50IiwicHkiLCJkYXNoYm9hcmRVcmwiLCJzcmMiLCJhbHQiLCJmbGF0IiwiRm9ybUdyb3VwIiwiTGFiZWwiLCJEcm9wWm9uZSIsIkRyb3Bab25lSXRlbSIsIkJ1dHRvbiIsIkljb24iLCJBZG1pbkpTIiwiVXNlckNvbXBvbmVudHMiLCJVcGxvYWRFZGl0Q29tcG9uZW50IiwiVXBsb2FkTGlzdENvbXBvbmVudCIsIlVwbG9hZFNob3dDb21wb25lbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQUVBLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBTyxFQUFFLFlBQVksRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQzlEO0lBQ0EsSUFBSUEsT0FBSyxHQUFHQyxzQkFBZ0IsQ0FBQztBQUM3QjtJQUNBLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQztJQUNwQixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUM7SUFDdEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBQ2hCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUNwQjtJQUNBO0lBQ0EsTUFBTSxZQUFZLEdBQUc7SUFDckIsSUFBSSxLQUFLLEVBQUUsRUFBRTtJQUNiLElBQUksb0JBQW9CLEVBQUUsS0FBSztJQUMvQixJQUFJLGFBQWEsRUFBRSxDQUFDO0lBQ3BCLElBQUksVUFBVSxFQUFFLEtBQUs7SUFDckIsSUFBSSxVQUFVLEVBQUUsSUFBSTtJQUNwQixJQUFJLGFBQWEsRUFBRSxRQUFRO0lBQzNCLElBQUksaUJBQWlCLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO0lBQ3hDLENBQUMsQ0FBQztJQUNGLE1BQU0sWUFBWSxHQUFHO0lBQ3JCLElBQUksS0FBSyxFQUFFLElBQUk7SUFDZixJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbkIsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUNaLElBQUksT0FBTyxFQUFFLEtBQUs7SUFDbEIsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2QsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDO0lBQzlCLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQztJ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QUMsQ0FBQztJQUNwRCxTQUFTO0lBQ1QsUUFBUSxRQUFRM0Ysc0JBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUU7SUFDL0csS0FBSztJQUNMLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO0lBQzVDLFFBQVEsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO0lBQ2xELFFBQVEsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RSxLQUFLO0lBQ0wsSUFBSSxRQUFRQSxzQkFBSyxDQUFDLGFBQWEsQ0FBQ0Esc0JBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxNQUFNQSxzQkFBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0lBQzlOLENBQUM7O0lDekNELE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxNQUFNQSxzQkFBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQzs7SUNDN0UsTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUs7SUFDeEIsSUFBSSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQy9CLElBQUksUUFBUUEsc0JBQUssQ0FBQyxhQUFhLENBQUM0RixzQkFBUyxFQUFFLElBQUk7SUFDL0MsUUFBUTVGLHNCQUFLLENBQUMsYUFBYSxDQUFDNkYsa0JBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQztJQUN4RCxRQUFRN0Ysc0JBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRTtJQUNqRSxDQUFDOztJQ1JEa0csT0FBTyxDQUFDQyxjQUFjLEdBQUcsRUFBRSxDQUFBO0lBRTNCRCxPQUFPLENBQUNDLGNBQWMsQ0FBQzdELFNBQVMsR0FBR0EsU0FBUyxDQUFBO0lBRTVDNEQsT0FBTyxDQUFDQyxjQUFjLENBQUNoRyxNQUFNLEdBQUdBLE1BQU0sQ0FBQTtJQUV0QytGLE9BQU8sQ0FBQ0MsY0FBYyxDQUFDZixlQUFlLEdBQUdBLGVBQWUsQ0FBQTtJQUV4RGMsT0FBTyxDQUFDQyxjQUFjLENBQUNDLG1CQUFtQixHQUFHQSxJQUFtQixDQUFBO0lBRWhFRixPQUFPLENBQUNDLGNBQWMsQ0FBQ0UsbUJBQW1CLEdBQUdBLElBQW1CLENBQUE7SUFFaEVILE9BQU8sQ0FBQ0MsY0FBYyxDQUFDRyxtQkFBbUIsR0FBR0EsSUFBbUI7Ozs7OzsiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCw0LDUsNiw3LDhdfQ==
