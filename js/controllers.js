angular.module('starter.controllers', ['forceng'])

.controller('AppCtrl', function($scope, force) {
  $scope.logout = function() {
    force.logout();
  };
})

.controller('WelcomeCtrl', function($scope, force) {
  console.log('controllers.js:WelcomeCtrl:Welcome to the App.');
})

.controller('OrdersCtrl', function($scope, force) {

  /* called when the page is displayed */
  force.query('SELECT Id,Description,AccountId,OrderNumber FROM Order ORDER BY CreatedDate DESC NULLS FIRST LIMIT 10').then(
    function(data) {
      $scope.orders = data.records;
    },
    function(error) {
      alert("Error Retrieving Orders");
      console.log(error);
    }
  );

  /* called on a refresh */
  $scope.refreshOrders = function() {
    force.query('SELECT Id,Description,AccountId,OrderNumber FROM Order ORDER BY CreatedDate DESC NULLS FIRST LIMIT 10').then(
      function(data) {
        $scope.orders = data.records;
        $scope.$broadcast('scroll.refreshComplete');
      },
      function(error) {
        alert("Error Retrieving Deliveries");
        $scope.$broadcast('scroll.refreshComplete');
        console.log(error);
      }
    );
  };
})

.controller('AccountListCtrl', function($scope, force) {
  force.query('select id, name from account limit 25').then(
    function(data) {
      $scope.accounts = data.records;
    },
    function(error) {
      alert("Error Retrieving Account List");
      console.log(error);
    }
  );

  $scope.refreshAccounts = function() {
    force.query('select id, name from account limit 25').then(
      function(data) {
        $scope.accounts = data.records;
        $scope.$broadcast('scroll.refreshComplete');
      },
      function(error) {
        alert("Error Retrieving Account List");
        $scope.$broadcast('scroll.refreshComplete');
        console.log(error);
      }
    );
  };
})

.controller('AccountDetailsCtrl', function ($scope, $stateParams, force) {
    force.retrieve('account', $stateParams.accountId, 'id,name,phone,billingaddress').then(
        function (account) {
            $scope.account = account;
        });
})

/*
 * TouchID Controller
 */
.controller("DeliverySignatureCtrl", function($scope, $ionicPlatform, $cordovaTouchID, $ionicPopup, $stateParams, force) {
  var canvas = document.getElementById('signatureCanvas');
  var signaturePad = new SignaturePad(canvas);
  $scope.signature;

  $scope.clearCanvas = function() {
    console.log("controllers.js:DeliverySignatureCtrl:clearCanvas - called.");
    signaturePad.clear();
  }

  $scope.saveCanvas = function() {
    var sigImg = signaturePad.toDataURL();
    $scope.signature = sigImg;
  }

  $scope.sign = function() {
    //Request touch Id authentication
    $cordovaTouchID.checkSupport().then(function() {
      $cordovaTouchID.authenticate("You must authenticate").then(function() {
        // authenication was successful
        console.log("controllers.js:DeliverySignatureCtrl:sign - Delivery Package Id is " + $stateParams.deliveryId)

        force.create("Delivery_Signature__c", {
          "Description__c": "IOS Signature",
          "Delivery_Package__c": $stateParams.deliveryId
        }).then(
          function(response) {
            var imageData = signaturePad.toDataURL();
            var attachment = {
              ParentId: response.id,
              Name: "DigitalSignature.png",
              body: imageData.split(',')[1]
            };
            force.addAttachment(attachment).then(
              function(response) {
                console.log("controllers.js:SignCtrl:sign - attachment result is" + JSON.stringify(response));
                //show success popup and clear the canvas
                var alertPopup = $ionicPopup.alert({
                  title: 'Signature Uploaded',
                  template: 'Thank you.  Your transaction has been recorded and your signature has been stored.'
                });
                alertPopup.then(function(res) {
                  console.log('controllers.js:SignCtrl:sign - signature upload confirmed');
                });
                $scope.clearCanvas();
              },
              function(error) {
                console.log("controllers.js:SignCtrl:sign - could not add attachment " + error);
              });
          },
          function(error) {
            console.log("controllers.js:SignCtrl:sign - could not create digital signature " + error);
          });
      }, function(error) {
        // authentication with touch Id failed
        console.log(JSON.stringify(error));
      });
    }, function(error) {
      // no support for Touch Id
      console.log(JSON.stringify(error));
    });
  }
})

/*
 * VanScanCtrl - Barcode Scanning and Package List Management
 *
 */
.controller('ReturnScanCtrl', function($scope, $cordovaBarcodeScanner, $cordovaTouchID, $ionicPopup, force) {
  //scanned items
  $scope.items = [];
  $scope.showSignPad = false;
  $scope.signature;
  $scope.data = {};
  $scope.returnedIds = [];

  var canvas = document.getElementById('signatureCanvas');
  var signaturePad = new SignaturePad(canvas);
  var scanning = false;

  console.log("scanning is " + scanning);

  $scope.scanBarcode = function() {
    console.log("scanning is " + scanning);

    if (scanning) return;
    scanning = true;
    $cordovaBarcodeScanner.scan().then(function(imageData) {
      scanning = false;
      $scope.items.push(JSON.parse(imageData.text));

      if (iamgeData.cancelled) {
        console.log("Cancelled - scanning is " + scanning);
      } else {
        console.log("Scanned - scanning is " + scanning);
      }
    }, function(error) {
      console.log("An error happened -> " + error);
      scanning = false;
    });
  };

  $scope.returnItems = function() {
    var myPopup = $ionicPopup.show({
      template: '<input type="text" ng-model="data.reason">',
      title: 'Please enter a reason',
      subTitle: 'You will need to sign',
      scope: $scope,
      buttons: [{
        text: 'Cancel'
      }, {
        text: '<b>Sign</b>',
        type: 'button-positive',
        onTap: function(e) {
          if (!$scope.data.reason) {
            e.preventDefault();
          } else {
            $scope.showSignPad = true;
          }
        }
      }]
    });
  };

  $scope.sign = function() {
    console.log("controllers.js:ReturnScanCtrl:sign - Signed for goods returns");
    //Request touch Id authentication
    $cordovaTouchID.checkSupport().then(function() {
      $cordovaTouchID.authenticate("You must authenticate").then(function() {
        console.log("controllers.js:ReturnScanCtrl:sign - returning " + $scope.items.length + " packages.");
        for (var i = 0; i < $scope.items.length; i++) {
          item = $scope.items[i];
          item.Reason__c = $scope.data.reason;
          force.create('Returned_Package__c', item).then(
            function(response) {
              console.log("controllers.js:ReturnScanCtrl:sign() - Returned Item response is " + JSON.stringify(response));
              $scope.returnedIds.push(response.id);
              force.create("Delivery_Signature__c", {
                "Description__c": "IOS Signature",
                "Returned_Package__c": response.id
              }).then(
                function(response) {
                  var imageData = signaturePad.toDataURL();
                  var attachment = {
                    ParentId: response.id,
                    Name: "DigitalSignature.png",
                    body: imageData.split(',')[1]
                  };
                  force.addAttachment(attachment).then(
                    function(response) {
                      console.log("controllers.js:SignCtrl:sign - attachment result is" + JSON.stringify(response));
                      // have we added all the items from the list?
                      if ($scope.returnedIds.length == $scope.items.length) {
                        $scope.items = [];
                        $scope.returnedIds = [];
                        $scope.showSignPad = false;
                        $scope.data.reason = '';
                        signaturePad.clear();
                      }
                    },
                    function(error) {
                      console.log("controllers.js:SignCtrl:sign - could not add attachment " + error);
                    });
                },
                function(error) {
                  console.log("controllers.js:SignCtrl:sign - could not create digital signature " + error);
                });

            },
            function(error) {
              console.log(JSON.stringify(error));
            }
          );
        }
      }, function(error) {
        // authentication with touch Id failed
        console.log(JSON.stringify(error));
      });
    }, function(error) {
      // no support for Touch Id
      console.log(JSON.stringify(error));
    });
  };

  $scope.cancelSignature = function() {
    signaturePad.clear();
    $scope.showSignPad = false;
  }

  $scope.clearSignature = function() {
    signaturePad.clear();
  }

  $scope.saveSignature = function() {
    var sigImg = signaturePad.toDataURL();
    $scope.signature = sigImg;
  }

  $scope.clearItems = function() {
    $scope.items = [];
  };

  $scope.testItem = function() {
    $scope.items.push({
      "Account__c": "0015800000CiVU6AAN",
      "Description__c": "Segal News Order - Mixed Cartons",
      "Notes__c": "Picked on iOS"
    });
  };

})

.controller('PickingListCtrl', function($scope, $cordovaBarcodeScanner, $ionicPopup, $stateParams, force) {
  //scanned items
  $scope.orderItems = [];
  $scope.showSignPad = false;
  var canvas = document.getElementById('signatureCanvas');
  var signaturePad = new SignaturePad(canvas);
  var scanning = false;

  force.query('SELECT PricebookEntry.Product2.ProductCode FROM OrderItem WHERE OrderId = \'' + $stateParams.orderId + '\'').then(
    function(data) {
      $scope.orderItems = data.records;
    },
    function(error) {
      alert("Error Retrieving orderItems List");
      console.log(error);
    }
  );

  $scope.scanBarcode = function() {
    if (scanning) return;
    scanning = true;
    $cordovaBarcodeScanner.scan().then(function(imageData) {
      scanning = false;
      //$scope.items.push(JSON.parse(imageData.text));
      var scan = JSON.parse(imageData.text);
      console.log('Checking for product code ' + scan.ProductCode);
      for (var i = 0; i < $scope.orderItems.length; i++) {
        console.log("scan code is " + scan.ProductCode);
        console.log("item code is " + $scope.orderItems[i].PricebookEntry.Product2.ProductCode);

        if (scan.ProductCode === $scope.orderItems[i].PricebookEntry.Product2.ProductCode) {
          console.log("WE HAVE A MATCH");
          $scope.orderItems[i].PricebookEntry.Product2.ProductCode += " [SELECTED]";
          break;
        }
      }
    }, function(error) {
      scanning = false;
      console.log("An error happened -> " + error);
    });
  };

  $scope.pickItems = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Confirm Picking List',
      template: 'Are you sure you want to pick ' + $scope.orderItems.length + ' item(s)?'
    });

    confirmPopup.then(function(res) {
      if (res) {
        $scope.showSignPad = true;
      } else {
        console.log('controllers.js:PickingListCtrl:pickedItems - Not confirmed.');
      }
    });
  };

  $scope.testItem = function() {
    var scan = JSON.parse('{"ProductCode":"LS-RD-KG20"}');
    console.log('Checking for product code ' + scan.ProductCode);
    for (var i = 0; i < $scope.orderItems.length; i++) {
      console.log("scan code is " + scan.ProductCode);
      console.log("item code is " + $scope.orderItems[i].PricebookEntry.Product2.ProductCode);

      if (scan.ProductCode === $scope.orderItems[i].PricebookEntry.Product2.ProductCode) {
        console.log("WE HAVE A MATCH");
        $scope.orderItems[i].PricebookEntry.Product2.ProductCode += " [SELECTED]";
        break;
      }
    }
  };

  $scope.sign = function() {
      force.create("Delivery_Signature__c", {
        "Description__c": "IOS Delivery Signature",
        "Order__c":$stateParams.orderId
      }).then (
        function(response) {
          var imageData = signaturePad.toDataURL();
          var attachment = {
            ParentId: response.id,
            Name: "DigitalSignature.png",
            body: imageData.split(',')[1]
          };
          force.addAttachment(attachment).then(
            function(response) {
              console.log("controllers.js:SignCtrl:sign - attachment result is" + JSON.stringify(response));
              // have we added all the items from the list?
              $scope.orderItems = [];
              $scope.showSignPad = false;
              signaturePad.clear();
            },
            function(error) {
              console.log("controllers.js:SignCtrl:sign - could not add attachment " + error);
            });
        },
        function(error) {
          console.log("controllers.js:SignCtrl:sign - could not create digital signature " + error);
        });
    }

    $scope.cancelSignature = function() {
      signaturePad.clear();
      $scope.showSignPad = false;
    }

    $scope.clearSignature = function() {
      signaturePad.clear();
    }
});
