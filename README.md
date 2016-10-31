To configure the Hybrid app

1.  Install the ionic Salesforce start application
# ionic start Barcode salesforce

2.  Install the icon and splash screens
# ionic resources

3.  Upgrade the iOS platform to 4.2.0 to support the Salesforce Mobile SDK
# ionic platform update ios@4.2.0

4.  Add the Mobile SDK Plugin
# cordova plugin add https://github.com/forcedotcom/SalesforceMobileSDK-CordovaPlugin

5. Build the applications
#ionic build ios

Note: If the build Fails with missing files - you may need to remove and add iOS platform again for some reason
# ionic platform rm ios
# ionic platform add ios@4.2.0

Open Xcode and enable Keychain Sharing in the App's capabilities section and execute the code
