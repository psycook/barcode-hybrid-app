#About this project
This Ionic Hybrid App simulates a delivery service App where the user can scan items from picklists and return items that are no longer required.  The App features a Barcode Scanner, Digital Signature Pad & Touch ID for security.

This git repository just contains the www folder for the Ionic hybrid application due to the large size of the complete project.

#Prerequisites
Cordova must be installed  
Ionic must be installed  
npm must be installed  
An Org. with Digital Signature Objects, Some Orders and Products Configured and Return Objects Configured. - simon.cook@salesforce.com for more information.  

#1.  Install the ionic Salesforce start application
```
ionic start Barcode salesforce
```

#2.  Install the icon and splash screens
```
cd Barcode  
ionic resources  
```

#3.  Upgrade the iOS platform to 4.2.0 to support the Salesforce Mobile SDK
```
ionic platform update ios@4.2.0
```

#4.  Add the Mobile SDK Plugin
```
cordova plugin add https://github.com/forcedotcom/SalesforceMobileSDK-CordovaPlugin
```

#5. Build the applications
```
ionic build ios
```

Note: If the build Fails with missing files - you may need to remove and add iOS platform again for some reason
```
ionic platform rm ios
ionic platform add ios@4.2.0
```

#6. Change the www folder
Once the default App has built Successfully then copy then rename it's www folder to _www and copy the www folder from this repository in it's place and install the required Cordova plugins  
```
cordova plugin add phonegap-plugin-barcodescanner  
cordova plugin add phonegap-plugin-touchid  
```

#7. Open Xcode and enable Keychain Sharing in the App's capabilities section and execute the code
Open the xcode project file from platforms/ios directory  
Build and deploy to a real device (camera required for the barcode scanner to function)  
