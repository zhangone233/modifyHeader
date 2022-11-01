(function (global) {
  const fetchOrigin = global.fetch;
  const XHROrigin = global.XMLHttpRequest;
  const storageName = '__modify-header-map';

  try {
    const storageMap = JSON.parse(global.localStorage.getItem(storageName) || '{}');
    let headerMap = storageMap || {};

    function modify() {
      function interceptorRequestXHR(xhr) {
        for (const key in headerMap) {
          if (headerMap.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headerMap[key]);
          }
        }
      }
      function interceptorRequestFetch(init) {
        if (!init.headers) {
          init.headers = new Headers();
        }

        for (const key in headerMap) {
          if (headerMap.hasOwnProperty(key)) {
            init.headers.append(key, headerMap[key]);
          }
        }
      }

      function factoryXHR() {
        function XHR() {
          // XHROrigin.call(this, arguments);
          // Failed to construct 'XMLHttpRequest': Please use the 'new' operator, this DOM object constructor can
          const xhr = new XHROrigin();
          Object.setPrototypeOf(xhr, this);
          return xhr;
        }

        function F() {
          this.open = function () {
            XHROrigin.prototype.open.apply(this, arguments);
            interceptorRequestXHR(this);
          };

          // this.send = function () {
          //   console.log('start send');
          //   XHROrigin.prototype.send.apply(this, arguments);
          // };
        }
        F.prototype = XHROrigin.prototype;
        XHR.prototype = new F();

        return XHR;
      }

      function factoryFetch() {
        function fetch(input, init) {
          interceptorRequestFetch(init);
          return fetchOrigin.apply(this, arguments);
        }

        return fetch;
      }

      // global.fetch = factoryFetch();
      // global.XMLHttpRequest = factoryXHR();

      Object.defineProperty(global, 'fetch', {
        value: factoryFetch(),
        writable: false,
      });

      Object.defineProperty(global, 'XMLHttpRequest', {
        value: factoryXHR(),
        writable: true,
      });
    }

    // eslint-disable-next-line max-lines-per-function
    function appendPanel() {
      const template =
        '<div class="mod-switch">modifyHeader</div><div class="mod-mask" style="display: none;"></div><div class="mod-panel" style="display: none;"><div class="header-list"></div><div class="header-add"><button>添加</button></div></div>';
      const container = document.createElement('div');
      container.id = '__modify-header';
      container.innerHTML = template;
      document.documentElement.appendChild(container);

      const modMask = container.getElementsByClassName('mod-mask')[0];
      const modPanel = container.getElementsByClassName('mod-panel')[0];
      const modSwitch = container.getElementsByClassName('mod-switch')[0];

      const headerAdd = modPanel.getElementsByClassName('header-add')[0];
      const headerList = modPanel.getElementsByClassName('header-list')[0];
      const addBtn = headerAdd.getElementsByTagName('button')[0];

      (function appendStyle() {
        const styleTag = document.createElement('style');
        const cssText = `
          #__modify-header .mod-switch {
            display: block;
            position: fixed;
            right: 35%;
            top: 0.76923077em;
            color: #FFF;
            background-color: #07c160;
            line-height: 1;
            font-size: 12px;
            padding: 0.61538462em 1.23076923em;
            z-index: 10000;
            border-radius: 0.30769231em;
            box-shadow: 0 0 0.61538462em rgb(0 0 0 / 40%);
          }
  
          #__modify-header .mod-mask {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10001;
            -webkit-transition: background 0.3s;
            transition: background 0.3s;
            -webkit-tap-highlight-color: transparent;
            overflow-y: scroll;
          }
  
          #__modify-header .mod-panel {
            display: none;
            position: fixed;
            min-height: 85%;
            height: 85%;
            left: 0;
            right: 0;
            bottom: -100%;
            z-index: 10002;
            background-color: #191919;
            transition: bottom 0.3s;
            padding: 10px;
            overflow-y: auto;
          }
  
          #__modify-header .mod-panel .header-list {
            
  
          }
          #__modify-header .mod-panel .header-add {
            text-align: center;
            margin-top: 10px;
          }
          #__modify-header .mod-panel .header-add button {
            width: 120px;
            height: 45px;
          }
        `;

        styleTag.innerText = cssText;
        document.documentElement.appendChild(styleTag);
      })();

      (function appendEvent() {
        function getAllField() {
          const newHeaderMap = {};
          const { children } = headerList;

          for (let i = 0; i < children.length; i++) {
            const childRow = children[i];
            const childrenRow = childRow.children;
            const keyInput = childrenRow[0];
            const valueInput = childrenRow[1];

            const key = keyInput.value;
            const { value } = valueInput;
            if (key && value) {
              newHeaderMap[key] = value;
            }
          }

          headerMap = newHeaderMap;
          global.localStorage.setItem(storageName, JSON.stringify(newHeaderMap));
        }

        function openPanel() {
          modPanel.style.bottom = '0';
          modPanel.style.display = 'block';
          modMask.style.display = 'block';
        }
        function closePanel() {
          modPanel.style.bottom = '-100%';
          modPanel.style.display = 'none';
          modMask.style.display = 'none';
          getAllField();
        }

        function removeRow() {
          headerList.removeChild(this.parentNode);
        }
        function onInputChange(e) {
          this.setAttribute('value', e.target.value);
        }
        function bindRowEvent() {
          const inputList = headerList.getElementsByTagName('input');
          const removeBtns = headerList.getElementsByClassName('remove-btn');

          for (let i = 0; i < removeBtns.length; i++) {
            const removeBtn = removeBtns[i];
            removeBtn.onclick = removeRow;
          }

          for (let j = 0; j < inputList.length; j++) {
            const input = inputList[j];
            input.onchange = onInputChange;
          }
        }

        modMask.addEventListener('click', closePanel);
        modSwitch.addEventListener('click', function () {
          modPanel.style.display === 'none' ? openPanel() : closePanel();
        });

        addBtn.addEventListener('click', function () {
          const template =
            '<div style="margin-bottom: 10px; display: flex; align-items: center;"><input type="text" style="flex: 1; height: 30px;" placeholder="输入key" /> : <input type="text" style="flex: 1; height: 30px;" placeholder="输入value" /> : <button class="remove-btn" style="height: 30px;">X</button></div>';
          headerList.innerHTML += template;
          bindRowEvent();
        });

        function reset() {
          let all = '';
          for (let key in headerMap) {
            if (!headerMap.hasOwnProperty(key)) {
              continue;
            }
            const value = headerMap[key];
            const template = `<div style="margin-bottom: 10px; display: flex; align-items: center;"><input type="text" style="flex: 1; height: 30px;" placeholder="输入key" value=${key} /> : <input type="text" style="flex: 1; height: 30px;" placeholder="输入value" value=${value} /> : <button class="remove-btn" style="height: 30px;">X</button></div>`;
            all += template;
          }
          headerList.innerHTML += all;
          bindRowEvent();
        }
        reset();
      })();
    }

    function init() {
      modify();

      document.addEventListener('DOMContentLoaded', function (event) {
        appendPanel();
      });
    }

    init();
  } catch (e) {
    console.error(e);
    global.localStorage.removeItem(storageName);
  }
})(typeof window !== 'undefined' ? window : this);
