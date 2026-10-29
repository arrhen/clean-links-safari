import Cocoa
import SafariServices
import WebKit

// The extension's bundle id is always the app's id plus ".Extension".
let extensionBundleIdentifier = (Bundle.main.bundleIdentifier ?? "") + ".Extension"

class ViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        webView.navigationDelegate = self
        webView.configuration.userContentController.add(self, name: "controller")
        webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!,
                            allowingReadAccessTo: Bundle.main.resourceURL!)

        // Refresh the status when the user comes back from Safari's settings.
        NotificationCenter.default.addObserver(self, selector: #selector(refreshState),
                                               name: NSApplication.didBecomeActiveNotification, object: nil)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? ""
        webView.evaluateJavaScript("setVersion('\(version)')")
        refreshState()
    }

    @objc func refreshState() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { [weak self] state, error in
            let value: String
            if let state = state, error == nil {
                value = state.isEnabled ? "on" : "off"
            } else {
                value = "unknown"
            }
            DispatchQueue.main.async {
                self?.webView.evaluateJavaScript("show('\(value)')")
            }
        }
    }

    // Open web links in the user's browser instead of inside this window.
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = navigationAction.request.url, url.scheme == "https" || url.scheme == "http" {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? String, body == "open-preferences" else { return }
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { _ in }
    }
}
