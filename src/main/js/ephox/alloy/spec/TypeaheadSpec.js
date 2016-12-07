define(
  'ephox.alloy.spec.TypeaheadSpec',

  [
    'ephox.alloy.api.SystemEvents',
    'ephox.alloy.api.behaviour.Coupling',
    'ephox.alloy.api.behaviour.Focusing',
    'ephox.alloy.api.behaviour.Sandboxing',
    'ephox.alloy.construct.EventHandler',
    'ephox.alloy.dropdown.Beta',
    'ephox.alloy.spec.InputSpec',
    'ephox.boulder.api.Objects',
    'ephox.highway.Merger',
    'ephox.peanut.Fun',
    'ephox.perhaps.Option',
    'ephox.sugar.api.Value',
    'global!document'
  ],

  function (SystemEvents, Coupling, Focusing, Sandboxing, EventHandler, Beta, InputSpec, Objects, Merger, Fun, Option, Value, document) {
    var make = function (detail, components, spec) {

      var behaviours = {
        streaming: {
          stream: {
            mode: 'throttle',
            delay: 1000
          },
          onStream: function (component, simulatedEvent) {
            var sandbox = Coupling.getCoupled(component, 'sandbox');
            var focusInInput = Focusing.isFocused(component);
            // You don't want it to change when something else has triggered the change.
            if (focusInInput) {
              /* REM:  if (Sandboxing.isShowing(sandbox)) Sandboxing.closeSandbox(sandbox); 
                This line makes it flicker. I wonder what it was for.
              */
              if (Value.get(component.element()).length >= detail.minChars()) {
                detail.previewing().set(true);
                Beta.enterPopup(detail, {
                  anchor: 'hotspot',
                  hotspot: component
                }, component);
              }
            }
          }
        },

        keying: {
          mode: 'special',
          onDown: function (comp, simulatedEvent) {
            var sandbox = Coupling.getCoupled(comp, 'sandbox');
            if (Sandboxing.isOpen(sandbox)) {
              sandbox.getSystem().triggerEvent('keydown', sandbox.element(), simulatedEvent.event());
              return Option.some(true);
            } else {
              return Beta.enterPopup(detail, comp);
            }              
          },
          onEscape: function (comp) {
            return Beta.escapePopup(detail, comp);
          },
          onUp: function (comp, simulatedEvent) {
            var sandbox = Coupling.getCoupled(comp, 'sandbox');
            sandbox.getSystem().triggerEvent('keydown', sandbox.element(), simulatedEvent.event());
            return Option.some(true);
          },
          onEnter: function (comp, simulatedEvent) {
            var sandbox = Coupling.getCoupled(comp, 'sandbox');
            return detail.onExecute()(sandbox, comp);
          }
        },

        toggling: {
          toggleClass: 'menu-open',
          aria: {
            'aria-expanded-attr': 'aria-expanded'
          }
        },

        focusing: true,
        tabstopping: true,
        coupling: {
          others: {
            sandbox: function (hotspot) {
              return Beta.makeSandbox(detail, {
                anchor: 'hotspot',
                hotspot: hotspot
              }, hotspot, {
                onOpen: Fun.identity,
                onClose: Fun.identity
              });
            }
          }
        }
      };

      return Merger.deepMerge(
        InputSpec.make(spec),
        {
          behaviours: behaviours,
          events: Objects.wrapAll([
            {
              key: SystemEvents.execute(),
              value: EventHandler.nu({
                run: function (comp) {
                  Beta.togglePopup(detail, comp);
                }
              })
            },
            {
              key: SystemEvents.postBlur(),
              value: EventHandler.nu({
                run: function (typeahead) {
                  var sandbox = Coupling.getCoupled(typeahead, 'sandbox');
                  // Sandboxing.closeSandbox(sandbox);
                }
              })
            }
          ])
        }
      );
    };

    return {
      make: make
    };
  }
);