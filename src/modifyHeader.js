(function (global) {
  let XHROrigin = global.XMLHttpRequest;
  let fetchOrigin = global.fetch;

  function interceptorRequestXHR(obj) {
    console.log(obj, 'interceptorRequestXHR');
  }
  function interceptorRequestFetch(obj) {
    console.log(obj, 'interceptorRequestFetch');
  }

  function factoryXHR() {
    function XHR() {
      XHROrigin.call(this, arguments);
    }

    function F() {
      this.open = function () {
        this.addEventListener('load', interceptorRequestXHR);
        XHROrigin.prototype.open.apply(this, arguments);
        console.log('open 结束');
      };

      this.send = function () {
        console.log('start send');
        XHROrigin.prototype.send.apply(this, arguments);
      };
    }
    F.prototype = XHROrigin.prototype;
    XHR.prototype = new F();

    return XHR;
  }

  function factoryFetch() {
    function fetch() {
      interceptorRequestFetch(arguments);
      return fetchOrigin.apply(this, arguments);
    }

    return fetch;
  }

  global.fetch = factoryFetch();
  global.XMLHttpRequest = factoryXHR();
})(typeof window !== 'undefined' ? window : this);
