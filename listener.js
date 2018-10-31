import { DeviceEventEmitter } from 'react-native';

const rootNode = {};

/**
 * Default seperator, you can set to modify event name connector globally.
 */
export let defaultSeperator = '$';

/**
 * Inner key for current event type in state param object when event listener callback is emitted.
 */
export let innerEventType = '_##_inner_##_event_##_type_##_';

/**
 * Register a event listener to an event type without listening to its sub event types.
 * @param {string|array|object} type Event type.
 * @param {function} func Event callback.
 * @returns {object} Listener object.
 */
export function register(type, func) {
    const eventName = normalEventName(type);
    const listenerObj = DeviceEventEmitter.addListener(eventName, func);
    if (rootNode[eventName]) {
        rootNode[eventName].push(listenerObj);
    } else {
        rootNode[eventName] = [listenerObj];
    }
    return listenerObj;
}

/**
 * Register a event listener to an event type with listening to its sub event types.
 * @param {array} type Event type.
 * @param {function} func Event callback.
 * @returns {object} Listener object.
 */
export function registerWithSubEvent(type, func) {
    const eventName = recursiveEventName(type);
    const listenerObj = DeviceEventEmitter.addListener(eventName, func);
    if (rootNode[eventName]) {
        rootNode[eventName].push(listenerObj);
    } else {
        rootNode[eventName] = [listenerObj];
    }
    return listenerObj;
}

/**
 * Unregister a event listener of an event type.
 * @param {string|array|object} type Event type.
 * @param {object} listenerObj Listener object, if it is undefined, we will remove all.
 */
export function unregister(type, listenerObj = undefined) {
    const eventName = normalEventName(type);
    const rEventName = Array.isArray(type) ? recursiveEventName(type) : undefined;
    if (listenerObj) {
        rootNode[eventName] = (rootNode[eventName] || []).filter(item => item !== listenerObj);
        if (rEventName) {
            rootNode[rEventName] = (rootNode[rEventName] || []).filter(item => item !== listenerObj);
        }
        listenerObj.remove();
        if (rootNode[eventName] && rootNode[eventName].length == 0) {
            delete rootNode[eventName];
        }
        if (rEventName && rootNode[rEventName] && rootNode[rEventName].length == 0) {
            delete rootNode[rEventName];
        }
    } else {
        rootNode[eventName].forEach(obj => obj.remove());
        delete rootNode[eventName];
        if (rEventName) {
            rootNode[rEventName].forEach(obj => obj.remove());
            delete rootNode[rEventName];
        }
    }
}

/**
 * Trigger an event type with a state param.
 * @param {string|array|object} type Event type.
 * @param {object} state The param passed to event callback, we will add the event type in it.
 */
export function trigger(type, state = undefined) {
    const newState = Object.prototype.isPrototypeOf(state) ? {...state, [innerEventType]: type} : state;
    const eventName = normalEventName(type);
    DeviceEventEmitter.emit(eventName, newState);
    if (Array.isArray(type)) {
        const upperType = [...type];
        while (upperType.length > 0) {
            const upperEventName = recursiveEventName(upperType);
            if (rootNode[upperEventName]) {
                DeviceEventEmitter.emit(upperEventName, newState);
            }
            upperType.pop();
        }
    }
}

/**
 * Generate recursive event name from an event type.
 * @param {array} type Event type.
 * @returns {string} Event name.
 */
function recursiveEventName(type) {
    const globalHeader = '&#@!$%%$!@#&' + defaultSeperator + '1234567890987654321';
    if (Array.isArray(type)) {
        return globalHeader + type.join(defaultSeperator);
    } else {
        throw new Error('event type must be array of string');
    }
}

/**
 * Generate normal event name from an event type.
 * @param {string|array|object} type Event type, can be a string or an array of string used seperator to join or an object with json string used.
 * @returns {string} Event name.
 */
function normalEventName(type) {
    if (Array.isArray(type)) {
        return type.join(defaultSeperator);
    } else if (typeof type === 'string') {
        return type;
    } else {
        return JSON.stringify(type);
    }
}