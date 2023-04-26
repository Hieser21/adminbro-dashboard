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
        className: 'topbar'
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
        ...handlers
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        color: "white",
        className: 'height'
      }, /*#__PURE__*/React__default.default.createElement(Card, {
        variant: "white",
        className: "angry-grid"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        id: "item-0"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card"
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
        className: "card"
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
        className: "card"
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
        className: 'card'
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card-details"
      }, /*#__PURE__*/React__default.default.createElement("p", {
        className: "text-title"
      }, "Announcements"), /*#__PURE__*/React__default.default.createElement("div", {
        className: "text-body"
      }, ping?.length ? /*#__PURE__*/React__default.default.createElement("pre", null, /*#__PURE__*/React__default.default.createElement("p", null, ping[0].announcement, " at ", ping[0].createdAt.split('T')[0]), /*#__PURE__*/React__default.default.createElement("p", null, ping[1].announcement, " at ", ping[1].createdAt.split('T')[0]), /*#__PURE__*/React__default.default.createElement("p", null, ping[2].announcement, " at ", ping[2].createdAt.split('T')[0])) : /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
        variant: "danger"
      }, "No announcements"))))), /*#__PURE__*/React__default.default.createElement("div", {
        id: "item-4"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: 'card'
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card-details"
      }, /*#__PURE__*/React__default.default.createElement("p", {
        className: "text-title"
      }, "Anti Exploit"), /*#__PURE__*/React__default.default.createElement("p", {
        className: 'text-body'
      }, "Lorem ipsum sit dolor amet lorem ipsum")))), /*#__PURE__*/React__default.default.createElement("div", {
        id: "item-5"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: 'card daily'
      }, /*#__PURE__*/React__default.default.createElement("div", {
        className: "card-details"
      }, /*#__PURE__*/React__default.default.createElement("p", {
        className: "text-title"
      }, "Daily"), /*#__PURE__*/React__default.default.createElement("div", {
        className: "text-body"
      }, logs?.length ? /*#__PURE__*/React__default.default.createElement("pre", null, /*#__PURE__*/React__default.default.createElement("p", null, logs[0].description, " at ", logs[0].createdAt.split('T')[0]), /*#__PURE__*/React__default.default.createElement("p", null, logs[1].description, " at ", logs[1].createdAt.split('T')[0]), /*#__PURE__*/React__default.default.createElement("p", null, logs[2].description, " at ", logs[2].createdAt.split('T')[0])) : /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
        variant: "danger"
      }, "No logs"))))))), /*#__PURE__*/React__default.default.createElement("footer", {
        className: 'footer-content'
      }, /*#__PURE__*/React__default.default.createElement("div", null, "Aspect Systems | All rights reserved.")));
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
    AdminJS.UserComponents.UploadEditComponent = Edit;
    AdminJS.UserComponents.UploadListComponent = List;
    AdminJS.UserComponents.UploadShowComponent = Show;

})(AdminJSDesignSystem, React, styled, AdminJS, ReactRedux);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvcmVhY3Qtc3dpcGVhYmxlL2xpYi9pbmRleC5qcyIsIi4uL2Rpc3QvY29tcG9uZW50cy9uYXZiYXIuanMiLCIuLi9kaXN0L2NvbXBvbmVudHMvbXktZGFzaGJvYXJkLWNvbXBvbmVudC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRFZGl0Q29tcG9uZW50LmpzIiwiLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS90eXBlcy9taW1lLXR5cGVzLnR5cGUuanMiLCIuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvZmlsZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRMaXN0Q29tcG9uZW50LmpzIiwiLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS9jb21wb25lbnRzL1VwbG9hZFNob3dDb21wb25lbnQuanMiLCIuZW50cnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG5jb25zdCBMRUZUID0gXCJMZWZ0XCI7XG5jb25zdCBSSUdIVCA9IFwiUmlnaHRcIjtcbmNvbnN0IFVQID0gXCJVcFwiO1xuY29uc3QgRE9XTiA9IFwiRG93blwiO1xuXG4vKiBnbG9iYWwgZG9jdW1lbnQgKi9cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgICBkZWx0YTogMTAsXG4gICAgcHJldmVudFNjcm9sbE9uU3dpcGU6IGZhbHNlLFxuICAgIHJvdGF0aW9uQW5nbGU6IDAsXG4gICAgdHJhY2tNb3VzZTogZmFsc2UsXG4gICAgdHJhY2tUb3VjaDogdHJ1ZSxcbiAgICBzd2lwZUR1cmF0aW9uOiBJbmZpbml0eSxcbiAgICB0b3VjaEV2ZW50T3B0aW9uczogeyBwYXNzaXZlOiB0cnVlIH0sXG59O1xuY29uc3QgaW5pdGlhbFN0YXRlID0ge1xuICAgIGZpcnN0OiB0cnVlLFxuICAgIGluaXRpYWw6IFswLCAwXSxcbiAgICBzdGFydDogMCxcbiAgICBzd2lwaW5nOiBmYWxzZSxcbiAgICB4eTogWzAsIDBdLFxufTtcbmNvbnN0IG1vdXNlTW92ZSA9IFwibW91c2Vtb3ZlXCI7XG5jb25zdCBtb3VzZVVwID0gXCJtb3VzZXVwXCI7XG5jb25zdCB0b3VjaEVuZCA9IFwidG91Y2hlbmRcIjtcbmNvbnN0IHRvdWNoTW92ZSA9IFwidG91Y2htb3ZlXCI7XG5jb25zdCB0b3VjaFN0YXJ0ID0gXCJ0b3VjaHN0YXJ0XCI7XG5mdW5jdGlvbiBnZXREaXJlY3Rpb24oYWJzWCwgYWJzWSwgZGVsdGFYLCBkZWx0YVkpIHtcbiAgICBpZiAoYWJzWCA+IGFic1kpIHtcbiAgICAgICAgaWYgKGRlbHRhWCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBSSUdIVDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTEVGVDtcbiAgICB9XG4gICAgZWxzZSBpZiAoZGVsdGFZID4gMCkge1xuICAgICAgICByZXR1cm4gRE9XTjtcbiAgICB9XG4gICAgcmV0dXJuIFVQO1xufVxuZnVuY3Rpb24gcm90YXRlWFlCeUFuZ2xlKHBvcywgYW5nbGUpIHtcbiAgICBpZiAoYW5nbGUgPT09IDApXG4gICAgICAgIHJldHVybiBwb3M7XG4gICAgY29uc3QgYW5nbGVJblJhZGlhbnMgPSAoTWF0aC5QSSAvIDE4MCkgKiBhbmdsZTtcbiAgICBjb25zdCB4ID0gcG9zWzBdICogTWF0aC5jb3MoYW5nbGVJblJhZGlhbnMpICsgcG9zWzFdICogTWF0aC5zaW4oYW5nbGVJblJhZGlhbnMpO1xuICAgIGNvbnN0IHkgPSBwb3NbMV0gKiBNYXRoLmNvcyhhbmdsZUluUmFkaWFucykgLSBwb3NbMF0gKiBNYXRoLnNpbihhbmdsZUluUmFkaWFucyk7XG4gICAgcmV0dXJuIFt4LCB5XTtcbn1cbmZ1bmN0aW9uIGdldEhhbmRsZXJzKHNldCwgaGFuZGxlclByb3BzKSB7XG4gICAgY29uc3Qgb25TdGFydCA9IChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBpc1RvdWNoID0gXCJ0b3VjaGVzXCIgaW4gZXZlbnQ7XG4gICAgICAgIC8vIGlmIG1vcmUgdGhhbiBhIHNpbmdsZSB0b3VjaCBkb24ndCB0cmFjaywgZm9yIG5vdy4uLlxuICAgICAgICBpZiAoaXNUb3VjaCAmJiBldmVudC50b3VjaGVzLmxlbmd0aCA+IDEpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHNldCgoc3RhdGUsIHByb3BzKSA9PiB7XG4gICAgICAgICAgICAvLyBzZXR1cCBtb3VzZSBsaXN0ZW5lcnMgb24gZG9jdW1lbnQgdG8gdHJhY2sgc3dpcGUgc2luY2Ugc3dpcGUgY2FuIGxlYXZlIGNvbnRhaW5lclxuICAgICAgICAgICAgaWYgKHByb3BzLnRyYWNrTW91c2UgJiYgIWlzVG91Y2gpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKG1vdXNlTW92ZSwgb25Nb3ZlKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKG1vdXNlVXAsIG9uVXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBpc1RvdWNoID8gZXZlbnQudG91Y2hlc1swXSA6IGV2ZW50O1xuICAgICAgICAgICAgY29uc3QgeHkgPSByb3RhdGVYWUJ5QW5nbGUoW2NsaWVudFgsIGNsaWVudFldLCBwcm9wcy5yb3RhdGlvbkFuZ2xlKTtcbiAgICAgICAgICAgIHByb3BzLm9uVG91Y2hTdGFydE9yT25Nb3VzZURvd24gJiZcbiAgICAgICAgICAgICAgICBwcm9wcy5vblRvdWNoU3RhcnRPck9uTW91c2VEb3duKHsgZXZlbnQgfSk7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKSwgaW5pdGlhbFN0YXRlKSwgeyBpbml0aWFsOiB4eS5zbGljZSgpLCB4eSwgc3RhcnQ6IGV2ZW50LnRpbWVTdGFtcCB8fCAwIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGNvbnN0IG9uTW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICBzZXQoKHN0YXRlLCBwcm9wcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXNUb3VjaCA9IFwidG91Y2hlc1wiIGluIGV2ZW50O1xuICAgICAgICAgICAgLy8gRGlzY291bnQgYSBzd2lwZSBpZiBhZGRpdGlvbmFsIHRvdWNoZXMgYXJlIHByZXNlbnQgYWZ0ZXJcbiAgICAgICAgICAgIC8vIGEgc3dpcGUgaGFzIHN0YXJ0ZWQuXG4gICAgICAgICAgICBpZiAoaXNUb3VjaCAmJiBldmVudC50b3VjaGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiBzd2lwZSBoYXMgZXhjZWVkZWQgZHVyYXRpb24gc3RvcCB0cmFja2luZ1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRpbWVTdGFtcCAtIHN0YXRlLnN0YXJ0ID4gcHJvcHMuc3dpcGVEdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZS5zd2lwaW5nID8gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSksIHsgc3dpcGluZzogZmFsc2UgfSkgOiBzdGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHsgY2xpZW50WCwgY2xpZW50WSB9ID0gaXNUb3VjaCA/IGV2ZW50LnRvdWNoZXNbMF0gOiBldmVudDtcbiAgICAgICAgICAgIGNvbnN0IFt4LCB5XSA9IHJvdGF0ZVhZQnlBbmdsZShbY2xpZW50WCwgY2xpZW50WV0sIHByb3BzLnJvdGF0aW9uQW5nbGUpO1xuICAgICAgICAgICAgY29uc3QgZGVsdGFYID0geCAtIHN0YXRlLnh5WzBdO1xuICAgICAgICAgICAgY29uc3QgZGVsdGFZID0geSAtIHN0YXRlLnh5WzFdO1xuICAgICAgICAgICAgY29uc3QgYWJzWCA9IE1hdGguYWJzKGRlbHRhWCk7XG4gICAgICAgICAgICBjb25zdCBhYnNZID0gTWF0aC5hYnMoZGVsdGFZKTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWUgPSAoZXZlbnQudGltZVN0YW1wIHx8IDApIC0gc3RhdGUuc3RhcnQ7XG4gICAgICAgICAgICBjb25zdCB2ZWxvY2l0eSA9IE1hdGguc3FydChhYnNYICogYWJzWCArIGFic1kgKiBhYnNZKSAvICh0aW1lIHx8IDEpO1xuICAgICAgICAgICAgY29uc3Qgdnh2eSA9IFtkZWx0YVggLyAodGltZSB8fCAxKSwgZGVsdGFZIC8gKHRpbWUgfHwgMSldO1xuICAgICAgICAgICAgY29uc3QgZGlyID0gZ2V0RGlyZWN0aW9uKGFic1gsIGFic1ksIGRlbHRhWCwgZGVsdGFZKTtcbiAgICAgICAgICAgIC8vIGlmIHN3aXBlIGlzIHVuZGVyIGRlbHRhIGFuZCB3ZSBoYXZlIG5vdCBzdGFydGVkIHRvIHRyYWNrIGEgc3dpcGU6IHNraXAgdXBkYXRlXG4gICAgICAgICAgICBjb25zdCBkZWx0YSA9IHR5cGVvZiBwcm9wcy5kZWx0YSA9PT0gXCJudW1iZXJcIlxuICAgICAgICAgICAgICAgID8gcHJvcHMuZGVsdGFcbiAgICAgICAgICAgICAgICA6IHByb3BzLmRlbHRhW2Rpci50b0xvd2VyQ2FzZSgpXSB8fFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UHJvcHMuZGVsdGE7XG4gICAgICAgICAgICBpZiAoYWJzWCA8IGRlbHRhICYmIGFic1kgPCBkZWx0YSAmJiAhc3RhdGUuc3dpcGluZylcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgICAgICBjb25zdCBldmVudERhdGEgPSB7XG4gICAgICAgICAgICAgICAgYWJzWCxcbiAgICAgICAgICAgICAgICBhYnNZLFxuICAgICAgICAgICAgICAgIGRlbHRhWCxcbiAgICAgICAgICAgICAgICBkZWx0YVksXG4gICAgICAgICAgICAgICAgZGlyLFxuICAgICAgICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgICAgICAgIGZpcnN0OiBzdGF0ZS5maXJzdCxcbiAgICAgICAgICAgICAgICBpbml0aWFsOiBzdGF0ZS5pbml0aWFsLFxuICAgICAgICAgICAgICAgIHZlbG9jaXR5LFxuICAgICAgICAgICAgICAgIHZ4dnksXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gY2FsbCBvblN3aXBlU3RhcnQgaWYgcHJlc2VudCBhbmQgaXMgZmlyc3Qgc3dpcGUgZXZlbnRcbiAgICAgICAgICAgIGV2ZW50RGF0YS5maXJzdCAmJiBwcm9wcy5vblN3aXBlU3RhcnQgJiYgcHJvcHMub25Td2lwZVN0YXJ0KGV2ZW50RGF0YSk7XG4gICAgICAgICAgICAvLyBjYWxsIG9uU3dpcGluZyBpZiBwcmVzZW50XG4gICAgICAgICAgICBwcm9wcy5vblN3aXBpbmcgJiYgcHJvcHMub25Td2lwaW5nKGV2ZW50RGF0YSk7XG4gICAgICAgICAgICAvLyB0cmFjayBpZiBhIHN3aXBlIGlzIGNhbmNlbGFibGUgKGhhbmRsZXIgZm9yIHN3aXBpbmcgb3Igc3dpcGVkKGRpcikgZXhpc3RzKVxuICAgICAgICAgICAgLy8gc28gd2UgY2FuIGNhbGwgcHJldmVudERlZmF1bHQgaWYgbmVlZGVkXG4gICAgICAgICAgICBsZXQgY2FuY2VsYWJsZVBhZ2VTd2lwZSA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKHByb3BzLm9uU3dpcGluZyB8fFxuICAgICAgICAgICAgICAgIHByb3BzLm9uU3dpcGVkIHx8XG4gICAgICAgICAgICAgICAgcHJvcHNbYG9uU3dpcGVkJHtkaXJ9YF0pIHtcbiAgICAgICAgICAgICAgICBjYW5jZWxhYmxlUGFnZVN3aXBlID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjYW5jZWxhYmxlUGFnZVN3aXBlICYmXG4gICAgICAgICAgICAgICAgcHJvcHMucHJldmVudFNjcm9sbE9uU3dpcGUgJiZcbiAgICAgICAgICAgICAgICBwcm9wcy50cmFja1RvdWNoICYmXG4gICAgICAgICAgICAgICAgZXZlbnQuY2FuY2VsYWJsZSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSksIHsgXG4gICAgICAgICAgICAgICAgLy8gZmlyc3QgaXMgbm93IGFsd2F5cyBmYWxzZVxuICAgICAgICAgICAgICAgIGZpcnN0OiBmYWxzZSwgZXZlbnREYXRhLCBzd2lwaW5nOiB0cnVlIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGNvbnN0IG9uRW5kID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHNldCgoc3RhdGUsIHByb3BzKSA9PiB7XG4gICAgICAgICAgICBsZXQgZXZlbnREYXRhO1xuICAgICAgICAgICAgaWYgKHN0YXRlLnN3aXBpbmcgJiYgc3RhdGUuZXZlbnREYXRhKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgc3dpcGUgaXMgbGVzcyB0aGFuIGR1cmF0aW9uIGZpcmUgc3dpcGVkIGNhbGxiYWNrc1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50aW1lU3RhbXAgLSBzdGF0ZS5zdGFydCA8IHByb3BzLnN3aXBlRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnREYXRhID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5ldmVudERhdGEpLCB7IGV2ZW50IH0pO1xuICAgICAgICAgICAgICAgICAgICBwcm9wcy5vblN3aXBlZCAmJiBwcm9wcy5vblN3aXBlZChldmVudERhdGEpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvblN3aXBlZERpciA9IHByb3BzW2BvblN3aXBlZCR7ZXZlbnREYXRhLmRpcn1gXTtcbiAgICAgICAgICAgICAgICAgICAgb25Td2lwZWREaXIgJiYgb25Td2lwZWREaXIoZXZlbnREYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9wcy5vblRhcCAmJiBwcm9wcy5vblRhcCh7IGV2ZW50IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJvcHMub25Ub3VjaEVuZE9yT25Nb3VzZVVwICYmIHByb3BzLm9uVG91Y2hFbmRPck9uTW91c2VVcCh7IGV2ZW50IH0pO1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSksIGluaXRpYWxTdGF0ZSksIHsgZXZlbnREYXRhIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGNvbnN0IGNsZWFuVXBNb3VzZSA9ICgpID0+IHtcbiAgICAgICAgLy8gc2FmZSB0byBqdXN0IGNhbGwgcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKG1vdXNlTW92ZSwgb25Nb3ZlKTtcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihtb3VzZVVwLCBvblVwKTtcbiAgICB9O1xuICAgIGNvbnN0IG9uVXAgPSAoZSkgPT4ge1xuICAgICAgICBjbGVhblVwTW91c2UoKTtcbiAgICAgICAgb25FbmQoZSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBUaGUgdmFsdWUgb2YgcGFzc2l2ZSBvbiB0b3VjaE1vdmUgZGVwZW5kcyBvbiBgcHJldmVudFNjcm9sbE9uU3dpcGVgOlxuICAgICAqIC0gdHJ1ZSA9PiB7IHBhc3NpdmU6IGZhbHNlIH1cbiAgICAgKiAtIGZhbHNlID0+IHsgcGFzc2l2ZTogdHJ1ZSB9IC8vIERlZmF1bHRcbiAgICAgKlxuICAgICAqIE5PVEU6IFdoZW4gcHJldmVudFNjcm9sbE9uU3dpcGUgaXMgdHJ1ZSwgd2UgYXR0ZW1wdCB0byBjYWxsIHByZXZlbnREZWZhdWx0IHRvIHByZXZlbnQgc2Nyb2xsLlxuICAgICAqXG4gICAgICogcHJvcHMudG91Y2hFdmVudE9wdGlvbnMgY2FuIGFsc28gYmUgc2V0IGZvciBhbGwgdG91Y2ggZXZlbnQgbGlzdGVuZXJzLFxuICAgICAqIGJ1dCBmb3IgYHRvdWNobW92ZWAgc3BlY2lmaWNhbGx5IHdoZW4gYHByZXZlbnRTY3JvbGxPblN3aXBlYCBpdCB3aWxsXG4gICAgICogc3VwZXJzZWRlIGFuZCBmb3JjZSBwYXNzaXZlIHRvIGZhbHNlLlxuICAgICAqXG4gICAgICovXG4gICAgY29uc3QgYXR0YWNoVG91Y2ggPSAoZWwsIHByb3BzKSA9PiB7XG4gICAgICAgIGxldCBjbGVhbnVwID0gKCkgPT4geyB9O1xuICAgICAgICBpZiAoZWwgJiYgZWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgY29uc3QgYmFzZU9wdGlvbnMgPSBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRQcm9wcy50b3VjaEV2ZW50T3B0aW9ucyksIHByb3BzLnRvdWNoRXZlbnRPcHRpb25zKTtcbiAgICAgICAgICAgIC8vIGF0dGFjaCB0b3VjaCBldmVudCBsaXN0ZW5lcnMgYW5kIGhhbmRsZXJzXG4gICAgICAgICAgICBjb25zdCB0bHMgPSBbXG4gICAgICAgICAgICAgICAgW3RvdWNoU3RhcnQsIG9uU3RhcnQsIGJhc2VPcHRpb25zXSxcbiAgICAgICAgICAgICAgICAvLyBwcmV2ZW50U2Nyb2xsT25Td2lwZSBvcHRpb24gc3VwZXJzZWRlcyB0b3VjaEV2ZW50T3B0aW9ucy5wYXNzaXZlXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICB0b3VjaE1vdmUsXG4gICAgICAgICAgICAgICAgICAgIG9uTW92ZSxcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBiYXNlT3B0aW9ucyksIChwcm9wcy5wcmV2ZW50U2Nyb2xsT25Td2lwZSA/IHsgcGFzc2l2ZTogZmFsc2UgfSA6IHt9KSksXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBbdG91Y2hFbmQsIG9uRW5kLCBiYXNlT3B0aW9uc10sXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgdGxzLmZvckVhY2goKFtlLCBoLCBvXSkgPT4gZWwuYWRkRXZlbnRMaXN0ZW5lcihlLCBoLCBvKSk7XG4gICAgICAgICAgICAvLyByZXR1cm4gcHJvcGVybHkgc2NvcGVkIGNsZWFudXAgbWV0aG9kIGZvciByZW1vdmluZyBsaXN0ZW5lcnMsIG9wdGlvbnMgbm90IHJlcXVpcmVkXG4gICAgICAgICAgICBjbGVhbnVwID0gKCkgPT4gdGxzLmZvckVhY2goKFtlLCBoXSkgPT4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihlLCBoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsZWFudXA7XG4gICAgfTtcbiAgICBjb25zdCBvblJlZiA9IChlbCkgPT4ge1xuICAgICAgICAvLyBcImlubGluZVwiIHJlZiBmdW5jdGlvbnMgYXJlIGNhbGxlZCB0d2ljZSBvbiByZW5kZXIsIG9uY2Ugd2l0aCBudWxsIHRoZW4gYWdhaW4gd2l0aCBET00gZWxlbWVudFxuICAgICAgICAvLyBpZ25vcmUgbnVsbCBoZXJlXG4gICAgICAgIGlmIChlbCA9PT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgc2V0KChzdGF0ZSwgcHJvcHMpID0+IHtcbiAgICAgICAgICAgIC8vIGlmIHRoZSBzYW1lIERPTSBlbCBhcyBwcmV2aW91cyBqdXN0IHJldHVybiBzdGF0ZVxuICAgICAgICAgICAgaWYgKHN0YXRlLmVsID09PSBlbClcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgICAgICBjb25zdCBhZGRTdGF0ZSA9IHt9O1xuICAgICAgICAgICAgLy8gaWYgbmV3IERPTSBlbCBjbGVhbiB1cCBvbGQgRE9NIGFuZCByZXNldCBjbGVhblVwVG91Y2hcbiAgICAgICAgICAgIGlmIChzdGF0ZS5lbCAmJiBzdGF0ZS5lbCAhPT0gZWwgJiYgc3RhdGUuY2xlYW5VcFRvdWNoKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuY2xlYW5VcFRvdWNoKCk7XG4gICAgICAgICAgICAgICAgYWRkU3RhdGUuY2xlYW5VcFRvdWNoID0gdm9pZCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gb25seSBhdHRhY2ggaWYgd2Ugd2FudCB0byB0cmFjayB0b3VjaFxuICAgICAgICAgICAgaWYgKHByb3BzLnRyYWNrVG91Y2ggJiYgZWwpIHtcbiAgICAgICAgICAgICAgICBhZGRTdGF0ZS5jbGVhblVwVG91Y2ggPSBhdHRhY2hUb3VjaChlbCwgcHJvcHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc3RvcmUgZXZlbnQgYXR0YWNoZWQgRE9NIGVsIGZvciBjb21wYXJpc29uLCBjbGVhbiB1cCwgYW5kIHJlLWF0dGFjaG1lbnRcbiAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCB7IGVsIH0pLCBhZGRTdGF0ZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLy8gc2V0IHJlZiBjYWxsYmFjayB0byBhdHRhY2ggdG91Y2ggZXZlbnQgbGlzdGVuZXJzXG4gICAgY29uc3Qgb3V0cHV0ID0ge1xuICAgICAgICByZWY6IG9uUmVmLFxuICAgIH07XG4gICAgLy8gaWYgdHJhY2sgbW91c2UgYXR0YWNoIG1vdXNlIGRvd24gbGlzdGVuZXJcbiAgICBpZiAoaGFuZGxlclByb3BzLnRyYWNrTW91c2UpIHtcbiAgICAgICAgb3V0cHV0Lm9uTW91c2VEb3duID0gb25TdGFydDtcbiAgICB9XG4gICAgcmV0dXJuIFtvdXRwdXQsIGF0dGFjaFRvdWNoXTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZVRyYW5zaWVudFN0YXRlKHN0YXRlLCBwcm9wcywgcHJldmlvdXNQcm9wcywgYXR0YWNoVG91Y2gpIHtcbiAgICAvLyBpZiB0cmFja1RvdWNoIGlzIG9mZiBvciB0aGVyZSBpcyBubyBlbCwgdGhlbiByZW1vdmUgaGFuZGxlcnMgaWYgbmVjZXNzYXJ5IGFuZCBleGl0XG4gICAgaWYgKCFwcm9wcy50cmFja1RvdWNoIHx8ICFzdGF0ZS5lbCkge1xuICAgICAgICBpZiAoc3RhdGUuY2xlYW5VcFRvdWNoKSB7XG4gICAgICAgICAgICBzdGF0ZS5jbGVhblVwVG91Y2goKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSksIHsgY2xlYW5VcFRvdWNoOiB1bmRlZmluZWQgfSk7XG4gICAgfVxuICAgIC8vIHRyYWNrVG91Y2ggaXMgb24sIHNvIGlmIHRoZXJlIGFyZSBubyBoYW5kbGVycyBhdHRhY2hlZCwgYXR0YWNoIHRoZW0gYW5kIGV4aXRcbiAgICBpZiAoIXN0YXRlLmNsZWFuVXBUb3VjaCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSksIHsgY2xlYW5VcFRvdWNoOiBhdHRhY2hUb3VjaChzdGF0ZS5lbCwgcHJvcHMpIH0pO1xuICAgIH1cbiAgICAvLyB0cmFja1RvdWNoIGlzIG9uIGFuZCBoYW5kbGVycyBhcmUgYWxyZWFkeSBhdHRhY2hlZCwgc28gaWYgcHJldmVudFNjcm9sbE9uU3dpcGUgY2hhbmdlcyB2YWx1ZSxcbiAgICAvLyByZW1vdmUgYW5kIHJlYXR0YWNoIGhhbmRsZXJzICh0aGlzIGlzIHJlcXVpcmVkIHRvIHVwZGF0ZSB0aGUgcGFzc2l2ZSBvcHRpb24gd2hlbiBhdHRhY2hpbmdcbiAgICAvLyB0aGUgaGFuZGxlcnMpXG4gICAgaWYgKHByb3BzLnByZXZlbnRTY3JvbGxPblN3aXBlICE9PSBwcmV2aW91c1Byb3BzLnByZXZlbnRTY3JvbGxPblN3aXBlIHx8XG4gICAgICAgIHByb3BzLnRvdWNoRXZlbnRPcHRpb25zLnBhc3NpdmUgIT09IHByZXZpb3VzUHJvcHMudG91Y2hFdmVudE9wdGlvbnMucGFzc2l2ZSkge1xuICAgICAgICBzdGF0ZS5jbGVhblVwVG91Y2goKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpLCB7IGNsZWFuVXBUb3VjaDogYXR0YWNoVG91Y2goc3RhdGUuZWwsIHByb3BzKSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlO1xufVxuZnVuY3Rpb24gdXNlU3dpcGVhYmxlKG9wdGlvbnMpIHtcbiAgICBjb25zdCB7IHRyYWNrTW91c2UgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgdHJhbnNpZW50U3RhdGUgPSBSZWFjdC51c2VSZWYoT2JqZWN0LmFzc2lnbih7fSwgaW5pdGlhbFN0YXRlKSk7XG4gICAgY29uc3QgdHJhbnNpZW50UHJvcHMgPSBSZWFjdC51c2VSZWYoT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdFByb3BzKSk7XG4gICAgLy8gdHJhY2sgcHJldmlvdXMgcmVuZGVyZWQgcHJvcHNcbiAgICBjb25zdCBwcmV2aW91c1Byb3BzID0gUmVhY3QudXNlUmVmKE9iamVjdC5hc3NpZ24oe30sIHRyYW5zaWVudFByb3BzLmN1cnJlbnQpKTtcbiAgICBwcmV2aW91c1Byb3BzLmN1cnJlbnQgPSBPYmplY3QuYXNzaWduKHt9LCB0cmFuc2llbnRQcm9wcy5jdXJyZW50KTtcbiAgICAvLyB1cGRhdGUgY3VycmVudCByZW5kZXIgcHJvcHMgJiBkZWZhdWx0c1xuICAgIHRyYW5zaWVudFByb3BzLmN1cnJlbnQgPSBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRQcm9wcyksIG9wdGlvbnMpO1xuICAgIC8vIEZvcmNlIGRlZmF1bHRzIGZvciBjb25maWcgcHJvcGVydGllc1xuICAgIGxldCBkZWZhdWx0S2V5O1xuICAgIGZvciAoZGVmYXVsdEtleSBpbiBkZWZhdWx0UHJvcHMpIHtcbiAgICAgICAgaWYgKHRyYW5zaWVudFByb3BzLmN1cnJlbnRbZGVmYXVsdEtleV0gPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgdHJhbnNpZW50UHJvcHMuY3VycmVudFtkZWZhdWx0S2V5XSA9IGRlZmF1bHRQcm9wc1tkZWZhdWx0S2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBbaGFuZGxlcnMsIGF0dGFjaFRvdWNoXSA9IFJlYWN0LnVzZU1lbW8oKCkgPT4gZ2V0SGFuZGxlcnMoKHN0YXRlU2V0dGVyKSA9PiAodHJhbnNpZW50U3RhdGUuY3VycmVudCA9IHN0YXRlU2V0dGVyKHRyYW5zaWVudFN0YXRlLmN1cnJlbnQsIHRyYW5zaWVudFByb3BzLmN1cnJlbnQpKSwgeyB0cmFja01vdXNlIH0pLCBbdHJhY2tNb3VzZV0pO1xuICAgIHRyYW5zaWVudFN0YXRlLmN1cnJlbnQgPSB1cGRhdGVUcmFuc2llbnRTdGF0ZSh0cmFuc2llbnRTdGF0ZS5jdXJyZW50LCB0cmFuc2llbnRQcm9wcy5jdXJyZW50LCBwcmV2aW91c1Byb3BzLmN1cnJlbnQsIGF0dGFjaFRvdWNoKTtcbiAgICByZXR1cm4gaGFuZGxlcnM7XG59XG5cbmV4cG9ydHMuRE9XTiA9IERPV047XG5leHBvcnRzLkxFRlQgPSBMRUZUO1xuZXhwb3J0cy5SSUdIVCA9IFJJR0hUO1xuZXhwb3J0cy5VUCA9IFVQO1xuZXhwb3J0cy51c2VTd2lwZWFibGUgPSB1c2VTd2lwZWFibGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXBcbiIsImltcG9ydCB7IEN1cnJlbnRVc2VyTmF2LCBCb3ggfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCB7IHVzZUN1cnJlbnRBZG1pbiB9IGZyb20gJ2FkbWluanMnO1xuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5sZXQgY3VycmVudEFkbWluVXNlcjtcbmxldCB0b2dnbGVyO1xuY29uc3QgVG9wQmFyID0gKHByb3BzKSA9PiB7XG4gICAgY29uc3QgW2N1cnJlbnRBZG1pbiwgc2V0Q3VycmVudEFkbWluXSA9IHVzZUN1cnJlbnRBZG1pbigpO1xuICAgIGNvbnN0IHsgdG9nZ2xlU2lkZWJhciB9ID0gcHJvcHM7XG4gICAgdG9nZ2xlciA9IHRvZ2dsZVNpZGViYXI7XG4gICAgY29uc3QgW3Nlc3Npb24sIHBhdGhzLCB2ZXJzaW9uc10gPSB1c2VTZWxlY3Rvcigoc3RhdGUpID0+IFtcbiAgICAgICAgc3RhdGUuc2Vzc2lvbixcbiAgICAgICAgc3RhdGUucGF0aHMsXG4gICAgICAgIHN0YXRlLnZlcnNpb25zLFxuICAgIF0pO1xuICAgIGN1cnJlbnRBZG1pblVzZXIgPSBjdXJyZW50QWRtaW47XG4gICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KEJveCwgeyBib3JkZXI6ICcwcHgnLCBmbGV4OiB0cnVlLCBmbGV4RGlyZWN0aW9uOiAncm93LXJldmVyc2UnLCBoZWlnaHQ6ICduYXZiYXJIZWlnaHQnLCBjbGFzc05hbWU6ICd0b3BiYXInIH0sXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQ3VycmVudFVzZXJOYXYsIHsgZHJvcEFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGljb246ICdMb2dPdXQnLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0xvZyBvdXQnLFxuICAgICAgICAgICAgICAgICAgICBocmVmOiAnL2FkbWluL2xvZ291dCcsXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIG5vUmVmQ2hlY2soKSB7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLCBsaW5lQWN0aW9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWNvbjogJ0Fycm93UmlnaHQnLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1NpZGViYXInLFxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiB0b2dnbGVTaWRlYmFyLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpY29uOiAnQWxlcnRDaXJjbGUnLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0hlbHAnLFxuICAgICAgICAgICAgICAgICAgICBocmVmOiAnaHR0cHM6Ly9kaXNjb3JkLmdnL0ZyeFhBQnRFJyxcbiAgICAgICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gbm9SZWZDaGVjaygpIHsgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLCBuYW1lOiBjdXJyZW50QWRtaW4ubmFtZSwgdGl0bGU6IGN1cnJlbnRBZG1pbi5yb2xlLCBhdmF0YXJVcmw6ICcvYXNzZXQvZmlsZXMvJyArIGN1cnJlbnRBZG1pbi5uYW1lICsgJy8nICsgY3VycmVudEFkbWluLnJvbGUgKyAnLnBuZycgfSkpKTtcbn07XG5leHBvcnQgeyBjdXJyZW50QWRtaW5Vc2VyLCB0b2dnbGVyIH07XG5leHBvcnQgZGVmYXVsdCBUb3BCYXI7XG4iLCJpbXBvcnQgeyBCb3gsIFBsYWNlaG9sZGVyLCBCYWRnZSB9IGZyb20gJ0BhZG1pbmpzL2Rlc2lnbi1zeXN0ZW0nO1xuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBzdHlsZWQgfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtL3N0eWxlZC1jb21wb25lbnRzJztcbmltcG9ydCB7IEFwaUNsaWVudCwgdXNlTm90aWNlIH0gZnJvbSAnYWRtaW5qcyc7XG5pbXBvcnQgeyB1c2VTd2lwZWFibGUgfSBmcm9tICdyZWFjdC1zd2lwZWFibGUnO1xuaW1wb3J0IHsgdG9nZ2xlciB9IGZyb20gJy4vbmF2YmFyJztcbmNvbnN0IGFwaSA9IG5ldyBBcGlDbGllbnQoKTtcbmNvbnN0IERhc2hib2FyZCA9ICgpID0+IHtcbiAgICBjb25zdCBbc3Vic2NyaXB0aW9uLCBzZXRTdWJzY3JpcHRpb25dID0gdXNlU3RhdGUoJycpO1xuICAgIGNvbnN0IFtzdGF0LCBzZXRTdGF0XSA9IHVzZVN0YXRlKCcnKTtcbiAgICBjb25zdCBbbG9ncywgc2V0TG9nc10gPSB1c2VTdGF0ZSgnJyk7XG4gICAgY29uc3QgW3BpbmcsIHNldFBpbmddID0gdXNlU3RhdGUoJycpO1xuICAgIGNvbnN0IFt1c2VyLCBzZXRVc2VyXSA9IHVzZVN0YXRlKCcnKTtcbiAgICBjb25zdCBoYW5kbGVycyA9IHVzZVN3aXBlYWJsZSh7XG4gICAgICAgIG9uU3dpcGVkUmlnaHQ6ICgpID0+IHRvZ2dsZXIoKSxcbiAgICAgICAgc3dpcGVEdXJhdGlvbjogNTAwLFxuICAgICAgICBwcmV2ZW50U2Nyb2xsT25Td2lwZTogdHJ1ZSxcbiAgICAgICAgdHJhY2tNb3VzZTogZmFsc2VcbiAgICB9KTtcbiAgICBjb25zdCBhZGROb3RpY2UgPSB1c2VOb3RpY2UoKTtcbiAgICBjb25zdCBoYW5kbGVDbGljayA9IChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH07XG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgYXBpLmdldERhc2hib2FyZCgpLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgc2V0U3Vic2NyaXB0aW9uKHJlcy5kYXRhLnN1YnNjcmlwdGlvbl90eXBlLnN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICBzZXRTdGF0KHJlcy5kYXRhLnN0YXQuaXNBY3RpdmUpO1xuICAgICAgICAgICAgc2V0TG9ncyhyZXMuZGF0YS5sb2dzKTtcbiAgICAgICAgICAgIHNldFBpbmcocmVzLmRhdGEucGluZyk7XG4gICAgICAgICAgICBzZXRVc2VyKHJlcy5kYXRhLnVzZXIubmFtZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIGNvbnN0IENhcmQgPSBzdHlsZWQoQm94KSBgXG4gIGhlaWdodDogMTAwJTtcbiAgYDtcbiAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyAuLi5oYW5kbGVycyB9LFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJveCwgeyBjb2xvcjogXCJ3aGl0ZVwiLCBjbGFzc05hbWU6ICdoZWlnaHQnIH0sXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KENhcmQsIHsgdmFyaWFudDogXCJ3aGl0ZVwiLCBjbGFzc05hbWU6IFwiYW5ncnktZ3JpZFwiIH0sXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGlkOiBcIml0ZW0tMFwiIH0sXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwiY2FyZFwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmQtZGV0YWlsc1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgeyBjbGFzc05hbWU6IFwidGV4dC10aXRsZVwiIH0sIFwiVXNlcm5hbWVcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJ0ZXh0LWJvZHlcIiB9LCB1c2VyPy5sZW5ndGggPyBSZWFjdC5jcmVhdGVFbGVtZW50KFwicHJlXCIsIG51bGwsIHVzZXIpIDogUmVhY3QuY3JlYXRlRWxlbWVudChQbGFjZWhvbGRlciwgeyBzdHlsZTogeyB3aWR0aDogMTAwLCBoZWlnaHQ6IDE0IH0gfSkpKSkpLFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBpZDogXCJpdGVtLTFcIiB9LFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmRcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJjYXJkLWRldGFpbHNcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIHsgY2xhc3NOYW1lOiBcInRleHQtdGl0bGVcIiB9LCBcIlN1YnNjcmlwdGlvblwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcInRleHQtYm9keVwiIH0sIHN1YnNjcmlwdGlvbj8ubGVuZ3RoID8gUmVhY3QuY3JlYXRlRWxlbWVudChcInByZVwiLCBudWxsLCBzdWJzY3JpcHRpb24pIDogUmVhY3QuY3JlYXRlRWxlbWVudChQbGFjZWhvbGRlciwgeyBzdHlsZTogeyB3aWR0aDogMTAwLCBoZWlnaHQ6IDE0IH0gfSkpKSkpLFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBpZDogXCJpdGVtLTJcIiB9LFxuICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmRcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJjYXJkLWRldGFpbHNcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIHsgY2xhc3NOYW1lOiBcInRleHQtdGl0bGVcIiB9LCBcIlN0YXR1c1wiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcInRleHQtYm9keVwiIH0sIHN0YXQgPT0gJ0FjdGl2ZScgPyBSZWFjdC5jcmVhdGVFbGVtZW50KFwicHJlXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQmFkZ2UsIHsgdmFyaWFudDogXCJzdWNjZXNzXCIgfSwgXCJBY3RpdmVcIikpIDogUmVhY3QuY3JlYXRlRWxlbWVudChCYWRnZSwgeyB2YXJpYW50OiBcImRhbmdlclwiIH0sIFwiT2ZmbGluZVwiKSkpKSksXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGlkOiBcIml0ZW0tM1wiIH0sXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6ICdjYXJkJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJjYXJkLWRldGFpbHNcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIHsgY2xhc3NOYW1lOiBcInRleHQtdGl0bGVcIiB9LCBcIkFubm91bmNlbWVudHNcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJ0ZXh0LWJvZHlcIiB9LCBwaW5nPy5sZW5ndGggPyBSZWFjdC5jcmVhdGVFbGVtZW50KFwicHJlXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaW5nWzBdLmFubm91bmNlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGF0IFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGluZ1swXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaW5nWzFdLmFubm91bmNlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGF0IFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGluZ1sxXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaW5nWzJdLmFubm91bmNlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGF0IFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGluZ1syXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSkpIDogUmVhY3QuY3JlYXRlRWxlbWVudChCYWRnZSwgeyB2YXJpYW50OiBcImRhbmdlclwiIH0sIFwiTm8gYW5ub3VuY2VtZW50c1wiKSkpKSksXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGlkOiBcIml0ZW0tNFwiIH0sXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6ICdjYXJkJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJjYXJkLWRldGFpbHNcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIHsgY2xhc3NOYW1lOiBcInRleHQtdGl0bGVcIiB9LCBcIkFudGkgRXhwbG9pdFwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicFwiLCB7IGNsYXNzTmFtZTogJ3RleHQtYm9keScgfSwgXCJMb3JlbSBpcHN1bSBzaXQgZG9sb3IgYW1ldCBsb3JlbSBpcHN1bVwiKSkpKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgaWQ6IFwiaXRlbS01XCIgfSxcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogJ2NhcmQgZGFpbHknIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImNhcmQtZGV0YWlsc1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgeyBjbGFzc05hbWU6IFwidGV4dC10aXRsZVwiIH0sIFwiRGFpbHlcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJ0ZXh0LWJvZHlcIiB9LCBsb2dzPy5sZW5ndGggPyBSZWFjdC5jcmVhdGVFbGVtZW50KFwicHJlXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dzWzBdLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgYXQgXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dzWzBdLmNyZWF0ZWRBdC5zcGxpdCgnVCcpWzBdKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ3NbMV0uZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBhdCBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ3NbMV0uY3JlYXRlZEF0LnNwbGl0KCdUJylbMF0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicFwiLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nc1syXS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGF0IFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nc1syXS5jcmVhdGVkQXQuc3BsaXQoJ1QnKVswXSkpIDogUmVhY3QuY3JlYXRlRWxlbWVudChCYWRnZSwgeyB2YXJpYW50OiBcImRhbmdlclwiIH0sIFwiTm8gbG9nc1wiKSkpKSkpKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImZvb3RlclwiLCB7IGNsYXNzTmFtZTogJ2Zvb3Rlci1jb250ZW50JyB9LFxuICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCBudWxsLCBcIkFzcGVjdCBTeXN0ZW1zIHwgQWxsIHJpZ2h0cyByZXNlcnZlZC5cIikpKSk7XG59O1xuZXhwb3J0IGRlZmF1bHQgRGFzaGJvYXJkO1xuIiwiaW1wb3J0IHsgRHJvcFpvbmUsIERyb3Bab25lSXRlbSwgRm9ybUdyb3VwLCBMYWJlbCB9IGZyb20gJ0BhZG1pbmpzL2Rlc2lnbi1zeXN0ZW0nO1xuaW1wb3J0IHsgZmxhdCB9IGZyb20gJ2FkbWluanMnO1xuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5jb25zdCBFZGl0ID0gKHsgcHJvcGVydHksIHJlY29yZCwgb25DaGFuZ2UgfSkgPT4ge1xuICAgIGNvbnN0IHsgcGFyYW1zIH0gPSByZWNvcmQ7XG4gICAgY29uc3QgeyBjdXN0b20gfSA9IHByb3BlcnR5O1xuICAgIGNvbnN0IHBhdGggPSBmbGF0LmdldChwYXJhbXMsIGN1c3RvbS5maWxlUGF0aFByb3BlcnR5KTtcbiAgICBjb25zdCBrZXkgPSBmbGF0LmdldChwYXJhbXMsIGN1c3RvbS5rZXlQcm9wZXJ0eSk7XG4gICAgY29uc3QgZmlsZSA9IGZsYXQuZ2V0KHBhcmFtcywgY3VzdG9tLmZpbGVQcm9wZXJ0eSk7XG4gICAgY29uc3QgW29yaWdpbmFsS2V5LCBzZXRPcmlnaW5hbEtleV0gPSB1c2VTdGF0ZShrZXkpO1xuICAgIGNvbnN0IFtmaWxlc1RvVXBsb2FkLCBzZXRGaWxlc1RvVXBsb2FkXSA9IHVzZVN0YXRlKFtdKTtcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICAvLyBpdCBtZWFucyBtZWFucyB0aGF0IHNvbWVvbmUgaGl0IHNhdmUgYW5kIG5ldyBmaWxlIGhhcyBiZWVuIHVwbG9hZGVkXG4gICAgICAgIC8vIGluIHRoaXMgY2FzZSBmbGllc1RvVXBsb2FkIHNob3VsZCBiZSBjbGVhcmVkLlxuICAgICAgICAvLyBUaGlzIGhhcHBlbnMgd2hlbiB1c2VyIHR1cm5zIG9mZiByZWRpcmVjdCBhZnRlciBuZXcvZWRpdFxuICAgICAgICBpZiAoKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIGtleSAhPT0gb3JpZ2luYWxLZXkpXG4gICAgICAgICAgICB8fCAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycgJiYgIW9yaWdpbmFsS2V5KVxuICAgICAgICAgICAgfHwgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnICYmIEFycmF5LmlzQXJyYXkoa2V5KSAmJiBrZXkubGVuZ3RoICE9PSBvcmlnaW5hbEtleS5sZW5ndGgpKSB7XG4gICAgICAgICAgICBzZXRPcmlnaW5hbEtleShrZXkpO1xuICAgICAgICAgICAgc2V0RmlsZXNUb1VwbG9hZChbXSk7XG4gICAgICAgIH1cbiAgICB9LCBba2V5LCBvcmlnaW5hbEtleV0pO1xuICAgIGNvbnN0IG9uVXBsb2FkID0gKGZpbGVzKSA9PiB7XG4gICAgICAgIHNldEZpbGVzVG9VcGxvYWQoZmlsZXMpO1xuICAgICAgICBvbkNoYW5nZShjdXN0b20uZmlsZVByb3BlcnR5LCBmaWxlcyk7XG4gICAgfTtcbiAgICBjb25zdCBoYW5kbGVSZW1vdmUgPSAoKSA9PiB7XG4gICAgICAgIG9uQ2hhbmdlKGN1c3RvbS5maWxlUHJvcGVydHksIG51bGwpO1xuICAgIH07XG4gICAgY29uc3QgaGFuZGxlTXVsdGlSZW1vdmUgPSAoc2luZ2xlS2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gKGZsYXQuZ2V0KHJlY29yZC5wYXJhbXMsIGN1c3RvbS5rZXlQcm9wZXJ0eSkgfHwgW10pLmluZGV4T2Yoc2luZ2xlS2V5KTtcbiAgICAgICAgY29uc3QgZmlsZXNUb0RlbGV0ZSA9IGZsYXQuZ2V0KHJlY29yZC5wYXJhbXMsIGN1c3RvbS5maWxlc1RvRGVsZXRlUHJvcGVydHkpIHx8IFtdO1xuICAgICAgICBpZiAocGF0aCAmJiBwYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1BhdGggPSBwYXRoLm1hcCgoY3VycmVudFBhdGgsIGkpID0+IChpICE9PSBpbmRleCA/IGN1cnJlbnRQYXRoIDogbnVsbCkpO1xuICAgICAgICAgICAgbGV0IG5ld1BhcmFtcyA9IGZsYXQuc2V0KHJlY29yZC5wYXJhbXMsIGN1c3RvbS5maWxlc1RvRGVsZXRlUHJvcGVydHksIFsuLi5maWxlc1RvRGVsZXRlLCBpbmRleF0pO1xuICAgICAgICAgICAgbmV3UGFyYW1zID0gZmxhdC5zZXQobmV3UGFyYW1zLCBjdXN0b20uZmlsZVBhdGhQcm9wZXJ0eSwgbmV3UGF0aCk7XG4gICAgICAgICAgICBvbkNoYW5nZSh7XG4gICAgICAgICAgICAgICAgLi4ucmVjb3JkLFxuICAgICAgICAgICAgICAgIHBhcmFtczogbmV3UGFyYW1zLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1lvdSBjYW5ub3QgcmVtb3ZlIGZpbGUgd2hlbiB0aGVyZSBhcmUgbm8gdXBsb2FkZWQgZmlsZXMgeWV0Jyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChGb3JtR3JvdXAsIG51bGwsXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTGFiZWwsIG51bGwsIHByb3BlcnR5LmxhYmVsKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChEcm9wWm9uZSwgeyBvbkNoYW5nZTogb25VcGxvYWQsIG11bHRpcGxlOiBjdXN0b20ubXVsdGlwbGUsIHZhbGlkYXRlOiB7XG4gICAgICAgICAgICAgICAgbWltZVR5cGVzOiBjdXN0b20ubWltZVR5cGVzLFxuICAgICAgICAgICAgICAgIG1heFNpemU6IGN1c3RvbS5tYXhTaXplLFxuICAgICAgICAgICAgfSwgZmlsZXM6IGZpbGVzVG9VcGxvYWQgfSksXG4gICAgICAgICFjdXN0b20ubXVsdGlwbGUgJiYga2V5ICYmIHBhdGggJiYgIWZpbGVzVG9VcGxvYWQubGVuZ3RoICYmIGZpbGUgIT09IG51bGwgJiYgKFJlYWN0LmNyZWF0ZUVsZW1lbnQoRHJvcFpvbmVJdGVtLCB7IGZpbGVuYW1lOiBrZXksIHNyYzogcGF0aCwgb25SZW1vdmU6IGhhbmRsZVJlbW92ZSB9KSksXG4gICAgICAgIGN1c3RvbS5tdWx0aXBsZSAmJiBrZXkgJiYga2V5Lmxlbmd0aCAmJiBwYXRoID8gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoUmVhY3QuRnJhZ21lbnQsIG51bGwsIGtleS5tYXAoKHNpbmdsZUtleSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIC8vIHdoZW4gd2UgcmVtb3ZlIGl0ZW1zIHdlIHNldCBvbmx5IHBhdGggaW5kZXggdG8gbnVsbHMuXG4gICAgICAgICAgICAvLyBrZXkgaXMgc3RpbGwgdGhlcmUuIFRoaXMgaXMgYmVjYXVzZVxuICAgICAgICAgICAgLy8gd2UgaGF2ZSB0byBtYWludGFpbiBhbGwgdGhlIGluZGV4ZXMuIFNvIGhlcmUgd2Ugc2ltcGx5IGZpbHRlciBvdXQgZWxlbWVudHMgd2hpY2hcbiAgICAgICAgICAgIC8vIHdlcmUgcmVtb3ZlZCBhbmQgZGlzcGxheSBvbmx5IHdoYXQgd2FzIGxlZnRcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRQYXRoID0gcGF0aFtpbmRleF07XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFBhdGggPyAoUmVhY3QuY3JlYXRlRWxlbWVudChEcm9wWm9uZUl0ZW0sIHsga2V5OiBzaW5nbGVLZXksIGZpbGVuYW1lOiBzaW5nbGVLZXksIHNyYzogcGF0aFtpbmRleF0sIG9uUmVtb3ZlOiAoKSA9PiBoYW5kbGVNdWx0aVJlbW92ZShzaW5nbGVLZXkpIH0pKSA6ICcnO1xuICAgICAgICB9KSkpIDogJycpKTtcbn07XG5leHBvcnQgZGVmYXVsdCBFZGl0O1xuIiwiZXhwb3J0IGNvbnN0IEF1ZGlvTWltZVR5cGVzID0gW1xuICAgICdhdWRpby9hYWMnLFxuICAgICdhdWRpby9taWRpJyxcbiAgICAnYXVkaW8veC1taWRpJyxcbiAgICAnYXVkaW8vbXBlZycsXG4gICAgJ2F1ZGlvL29nZycsXG4gICAgJ2FwcGxpY2F0aW9uL29nZycsXG4gICAgJ2F1ZGlvL29wdXMnLFxuICAgICdhdWRpby93YXYnLFxuICAgICdhdWRpby93ZWJtJyxcbiAgICAnYXVkaW8vM2dwcDInLFxuXTtcbmV4cG9ydCBjb25zdCBWaWRlb01pbWVUeXBlcyA9IFtcbiAgICAndmlkZW8veC1tc3ZpZGVvJyxcbiAgICAndmlkZW8vbXBlZycsXG4gICAgJ3ZpZGVvL29nZycsXG4gICAgJ3ZpZGVvL21wMnQnLFxuICAgICd2aWRlby93ZWJtJyxcbiAgICAndmlkZW8vM2dwcCcsXG4gICAgJ3ZpZGVvLzNncHAyJyxcbl07XG5leHBvcnQgY29uc3QgSW1hZ2VNaW1lVHlwZXMgPSBbXG4gICAgJ2ltYWdlL2JtcCcsXG4gICAgJ2ltYWdlL2dpZicsXG4gICAgJ2ltYWdlL2pwZWcnLFxuICAgICdpbWFnZS9wbmcnLFxuICAgICdpbWFnZS9zdmcreG1sJyxcbiAgICAnaW1hZ2Uvdm5kLm1pY3Jvc29mdC5pY29uJyxcbiAgICAnaW1hZ2UvdGlmZicsXG4gICAgJ2ltYWdlL3dlYnAnLFxuXTtcbmV4cG9ydCBjb25zdCBDb21wcmVzc2VkTWltZVR5cGVzID0gW1xuICAgICdhcHBsaWNhdGlvbi94LWJ6aXAnLFxuICAgICdhcHBsaWNhdGlvbi94LWJ6aXAyJyxcbiAgICAnYXBwbGljYXRpb24vZ3ppcCcsXG4gICAgJ2FwcGxpY2F0aW9uL2phdmEtYXJjaGl2ZScsXG4gICAgJ2FwcGxpY2F0aW9uL3gtdGFyJyxcbiAgICAnYXBwbGljYXRpb24vemlwJyxcbiAgICAnYXBwbGljYXRpb24veC03ei1jb21wcmVzc2VkJyxcbl07XG5leHBvcnQgY29uc3QgRG9jdW1lbnRNaW1lVHlwZXMgPSBbXG4gICAgJ2FwcGxpY2F0aW9uL3gtYWJpd29yZCcsXG4gICAgJ2FwcGxpY2F0aW9uL3gtZnJlZWFyYycsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5hbWF6b24uZWJvb2snLFxuICAgICdhcHBsaWNhdGlvbi9tc3dvcmQnLFxuICAgICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5kb2N1bWVudCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5tcy1mb250b2JqZWN0JyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5wcmVzZW50YXRpb24nLFxuICAgICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0JyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC50ZXh0JyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQnLFxuICAgICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwucHJlc2VudGF0aW9uJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLnJhcicsXG4gICAgJ2FwcGxpY2F0aW9uL3J0ZicsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnNoZWV0Jyxcbl07XG5leHBvcnQgY29uc3QgVGV4dE1pbWVUeXBlcyA9IFtcbiAgICAndGV4dC9jc3MnLFxuICAgICd0ZXh0L2NzdicsXG4gICAgJ3RleHQvaHRtbCcsXG4gICAgJ3RleHQvY2FsZW5kYXInLFxuICAgICd0ZXh0L2phdmFzY3JpcHQnLFxuICAgICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAnYXBwbGljYXRpb24vbGQranNvbicsXG4gICAgJ3RleHQvamF2YXNjcmlwdCcsXG4gICAgJ3RleHQvcGxhaW4nLFxuICAgICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnLFxuICAgICdhcHBsaWNhdGlvbi94bWwnLFxuICAgICd0ZXh0L3htbCcsXG5dO1xuZXhwb3J0IGNvbnN0IEJpbmFyeURvY3NNaW1lVHlwZXMgPSBbXG4gICAgJ2FwcGxpY2F0aW9uL2VwdWIremlwJyxcbiAgICAnYXBwbGljYXRpb24vcGRmJyxcbl07XG5leHBvcnQgY29uc3QgRm9udE1pbWVUeXBlcyA9IFtcbiAgICAnZm9udC9vdGYnLFxuICAgICdmb250L3R0ZicsXG4gICAgJ2ZvbnQvd29mZicsXG4gICAgJ2ZvbnQvd29mZjInLFxuXTtcbmV4cG9ydCBjb25zdCBPdGhlck1pbWVUeXBlcyA9IFtcbiAgICAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyxcbiAgICAnYXBwbGljYXRpb24veC1jc2gnLFxuICAgICdhcHBsaWNhdGlvbi92bmQuYXBwbGUuaW5zdGFsbGVyK3htbCcsXG4gICAgJ2FwcGxpY2F0aW9uL3gtaHR0cGQtcGhwJyxcbiAgICAnYXBwbGljYXRpb24veC1zaCcsXG4gICAgJ2FwcGxpY2F0aW9uL3gtc2hvY2t3YXZlLWZsYXNoJyxcbiAgICAndm5kLnZpc2lvJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm1vemlsbGEueHVsK3htbCcsXG5dO1xuZXhwb3J0IGNvbnN0IE1pbWVUeXBlcyA9IFtcbiAgICAuLi5BdWRpb01pbWVUeXBlcyxcbiAgICAuLi5WaWRlb01pbWVUeXBlcyxcbiAgICAuLi5JbWFnZU1pbWVUeXBlcyxcbiAgICAuLi5Db21wcmVzc2VkTWltZVR5cGVzLFxuICAgIC4uLkRvY3VtZW50TWltZVR5cGVzLFxuICAgIC4uLlRleHRNaW1lVHlwZXMsXG4gICAgLi4uQmluYXJ5RG9jc01pbWVUeXBlcyxcbiAgICAuLi5PdGhlck1pbWVUeXBlcyxcbiAgICAuLi5Gb250TWltZVR5cGVzLFxuICAgIC4uLk90aGVyTWltZVR5cGVzLFxuXTtcbiIsIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXNcbmltcG9ydCB7IEJveCwgQnV0dG9uLCBJY29uIH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5pbXBvcnQgeyBmbGF0IH0gZnJvbSAnYWRtaW5qcyc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQXVkaW9NaW1lVHlwZXMsIEltYWdlTWltZVR5cGVzIH0gZnJvbSAnLi4vdHlwZXMvbWltZS10eXBlcy50eXBlLmpzJztcbmNvbnN0IFNpbmdsZUZpbGUgPSAocHJvcHMpID0+IHtcbiAgICBjb25zdCB7IG5hbWUsIHBhdGgsIG1pbWVUeXBlLCB3aWR0aCB9ID0gcHJvcHM7XG4gICAgaWYgKHBhdGggJiYgcGF0aC5sZW5ndGgpIHtcbiAgICAgICAgaWYgKG1pbWVUeXBlICYmIEltYWdlTWltZVR5cGVzLmluY2x1ZGVzKG1pbWVUeXBlKSkge1xuICAgICAgICAgICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KFwiaW1nXCIsIHsgc3JjOiBwYXRoLCBzdHlsZTogeyBtYXhIZWlnaHQ6IHdpZHRoLCBtYXhXaWR0aDogd2lkdGggfSwgYWx0OiBuYW1lIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWltZVR5cGUgJiYgQXVkaW9NaW1lVHlwZXMuaW5jbHVkZXMobWltZVR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJhdWRpb1wiLCB7IGNvbnRyb2xzOiB0cnVlLCBzcmM6IHBhdGggfSxcbiAgICAgICAgICAgICAgICBcIllvdXIgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHRoZVwiLFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJjb2RlXCIsIG51bGwsIFwiYXVkaW9cIiksXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInRyYWNrXCIsIHsga2luZDogXCJjYXB0aW9uc1wiIH0pKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KEJveCwgbnVsbCxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCdXR0b24sIHsgYXM6IFwiYVwiLCBocmVmOiBwYXRoLCBtbDogXCJkZWZhdWx0XCIsIHNpemU6IFwic21cIiwgcm91bmRlZDogdHJ1ZSwgdGFyZ2V0OiBcIl9ibGFua1wiIH0sXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEljb24sIHsgaWNvbjogXCJEb2N1bWVudERvd25sb2FkXCIsIGNvbG9yOiBcIndoaXRlXCIsIG1yOiBcImRlZmF1bHRcIiB9KSxcbiAgICAgICAgICAgIG5hbWUpKSk7XG59O1xuY29uc3QgRmlsZSA9ICh7IHdpZHRoLCByZWNvcmQsIHByb3BlcnR5IH0pID0+IHtcbiAgICBjb25zdCB7IGN1c3RvbSB9ID0gcHJvcGVydHk7XG4gICAgbGV0IHBhdGggPSBmbGF0LmdldChyZWNvcmQ/LnBhcmFtcywgY3VzdG9tLmZpbGVQYXRoUHJvcGVydHkpO1xuICAgIGlmICghcGF0aCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbmFtZSA9IGZsYXQuZ2V0KHJlY29yZD8ucGFyYW1zLCBjdXN0b20uZmlsZU5hbWVQcm9wZXJ0eSA/IGN1c3RvbS5maWxlTmFtZVByb3BlcnR5IDogY3VzdG9tLmtleVByb3BlcnR5KTtcbiAgICBjb25zdCBtaW1lVHlwZSA9IGN1c3RvbS5taW1lVHlwZVByb3BlcnR5XG4gICAgICAgICYmIGZsYXQuZ2V0KHJlY29yZD8ucGFyYW1zLCBjdXN0b20ubWltZVR5cGVQcm9wZXJ0eSk7XG4gICAgaWYgKCFwcm9wZXJ0eS5jdXN0b20ubXVsdGlwbGUpIHtcbiAgICAgICAgaWYgKGN1c3RvbS5vcHRzICYmIGN1c3RvbS5vcHRzLmJhc2VVcmwpIHtcbiAgICAgICAgICAgIHBhdGggPSBgJHtjdXN0b20ub3B0cy5iYXNlVXJsfS8ke25hbWV9YDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoU2luZ2xlRmlsZSwgeyBwYXRoOiBwYXRoLCBuYW1lOiBuYW1lLCB3aWR0aDogd2lkdGgsIG1pbWVUeXBlOiBtaW1lVHlwZSB9KSk7XG4gICAgfVxuICAgIGlmIChjdXN0b20ub3B0cyAmJiBjdXN0b20ub3B0cy5iYXNlVXJsKSB7XG4gICAgICAgIGNvbnN0IGJhc2VVcmwgPSBjdXN0b20ub3B0cy5iYXNlVXJsIHx8ICcnO1xuICAgICAgICBwYXRoID0gcGF0aC5tYXAoKHNpbmdsZVBhdGgsIGluZGV4KSA9PiBgJHtiYXNlVXJsfS8ke25hbWVbaW5kZXhdfWApO1xuICAgIH1cbiAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoUmVhY3QuRnJhZ21lbnQsIG51bGwsIHBhdGgubWFwKChzaW5nbGVQYXRoLCBpbmRleCkgPT4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoU2luZ2xlRmlsZSwgeyBrZXk6IHNpbmdsZVBhdGgsIHBhdGg6IHNpbmdsZVBhdGgsIG5hbWU6IG5hbWVbaW5kZXhdLCB3aWR0aDogd2lkdGgsIG1pbWVUeXBlOiBtaW1lVHlwZVtpbmRleF0gfSkpKSkpO1xufTtcbmV4cG9ydCBkZWZhdWx0IEZpbGU7XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IEZpbGUgZnJvbSAnLi9maWxlLmpzJztcbmNvbnN0IExpc3QgPSAocHJvcHMpID0+IChSZWFjdC5jcmVhdGVFbGVtZW50KEZpbGUsIHsgd2lkdGg6IDEwMCwgLi4ucHJvcHMgfSkpO1xuZXhwb3J0IGRlZmF1bHQgTGlzdDtcbiIsImltcG9ydCB7IEZvcm1Hcm91cCwgTGFiZWwgfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgRmlsZSBmcm9tICcuL2ZpbGUuanMnO1xuY29uc3QgU2hvdyA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IHsgcHJvcGVydHkgfSA9IHByb3BzO1xuICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChGb3JtR3JvdXAsIG51bGwsXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTGFiZWwsIG51bGwsIHByb3BlcnR5LmxhYmVsKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGaWxlLCB7IHdpZHRoOiBcIjEwMCVcIiwgLi4ucHJvcHMgfSkpKTtcbn07XG5leHBvcnQgZGVmYXVsdCBTaG93O1xuIiwiQWRtaW5KUy5Vc2VyQ29tcG9uZW50cyA9IHt9XG5pbXBvcnQgRGFzaGJvYXJkIGZyb20gJy4uL2Rpc3QvY29tcG9uZW50cy9teS1kYXNoYm9hcmQtY29tcG9uZW50J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5EYXNoYm9hcmQgPSBEYXNoYm9hcmRcbmltcG9ydCBUb3BCYXIgZnJvbSAnLi4vZGlzdC9jb21wb25lbnRzL25hdmJhcidcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuVG9wQmFyID0gVG9wQmFyXG5pbXBvcnQgVXBsb2FkRWRpdENvbXBvbmVudCBmcm9tICcuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkRWRpdENvbXBvbmVudCdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuVXBsb2FkRWRpdENvbXBvbmVudCA9IFVwbG9hZEVkaXRDb21wb25lbnRcbmltcG9ydCBVcGxvYWRMaXN0Q29tcG9uZW50IGZyb20gJy4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRMaXN0Q29tcG9uZW50J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5VcGxvYWRMaXN0Q29tcG9uZW50ID0gVXBsb2FkTGlzdENvbXBvbmVudFxuaW1wb3J0IFVwbG9hZFNob3dDb21wb25lbnQgZnJvbSAnLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS9jb21wb25lbnRzL1VwbG9hZFNob3dDb21wb25lbnQnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLlVwbG9hZFNob3dDb21wb25lbnQgPSBVcGxvYWRTaG93Q29tcG9uZW50Il0sIm5hbWVzIjpbIlJlYWN0IiwicmVxdWlyZSQkMCIsInRvZ2dsZXIiLCJUb3BCYXIiLCJwcm9wcyIsImN1cnJlbnRBZG1pbiIsInNldEN1cnJlbnRBZG1pbiIsInVzZUN1cnJlbnRBZG1pbiIsInRvZ2dsZVNpZGViYXIiLCJ1c2VTZWxlY3RvciIsInN0YXRlIiwic2Vzc2lvbiIsInBhdGhzIiwidmVyc2lvbnMiLCJjcmVhdGVFbGVtZW50IiwiQm94IiwiYm9yZGVyIiwiZmxleCIsImZsZXhEaXJlY3Rpb24iLCJoZWlnaHQiLCJjbGFzc05hbWUiLCJDdXJyZW50VXNlck5hdiIsImRyb3BBY3Rpb25zIiwiaWNvbiIsImxhYmVsIiwiaHJlZiIsIm9uQ2xpY2siLCJub1JlZkNoZWNrIiwibGluZUFjdGlvbnMiLCJuYW1lIiwidGl0bGUiLCJyb2xlIiwiYXZhdGFyVXJsIiwiYXBpIiwiQXBpQ2xpZW50IiwiRGFzaGJvYXJkIiwic3Vic2NyaXB0aW9uIiwic2V0U3Vic2NyaXB0aW9uIiwidXNlU3RhdGUiLCJzdGF0Iiwic2V0U3RhdCIsImxvZ3MiLCJzZXRMb2dzIiwicGluZyIsInNldFBpbmciLCJ1c2VyIiwic2V0VXNlciIsImhhbmRsZXJzIiwidXNlU3dpcGVhYmxlIiwib25Td2lwZWRSaWdodCIsInN3aXBlRHVyYXRpb24iLCJwcmV2ZW50U2Nyb2xsT25Td2lwZSIsInRyYWNrTW91c2UiLCJ1c2VOb3RpY2UiLCJ1c2VFZmZlY3QiLCJnZXREYXNoYm9hcmQiLCJ0aGVuIiwicmVzIiwiZGF0YSIsInN1YnNjcmlwdGlvbl90eXBlIiwiaXNBY3RpdmUiLCJDYXJkIiwic3R5bGVkIiwiY29sb3IiLCJ2YXJpYW50IiwiaWQiLCJsZW5ndGgiLCJQbGFjZWhvbGRlciIsInN0eWxlIiwid2lkdGgiLCJCYWRnZSIsImFubm91bmNlbWVudCIsImNyZWF0ZWRBdCIsInNwbGl0IiwiZGVzY3JpcHRpb24iLCJmbGF0IiwiRm9ybUdyb3VwIiwiTGFiZWwiLCJEcm9wWm9uZSIsIkRyb3Bab25lSXRlbSIsIkJ1dHRvbiIsIkljb24iLCJBZG1pbkpTIiwiVXNlckNvbXBvbmVudHMiLCJVcGxvYWRFZGl0Q29tcG9uZW50IiwiVXBsb2FkTGlzdENvbXBvbmVudCIsIlVwbG9hZFNob3dDb21wb25lbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQUVBLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBTyxFQUFFLFlBQVksRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxD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
