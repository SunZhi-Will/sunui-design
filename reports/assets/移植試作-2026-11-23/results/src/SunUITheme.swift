import SwiftUI

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(.sRGB, red: Double((hex >> 16) & 0xff) / 255, green: Double((hex >> 8) & 0xff) / 255, blue: Double(hex & 0xff) / 255, opacity: opacity)
    }
}

/// SunUI colour roles. Defaults match the shadcn neutral theme; replace with the app's own colours.
struct SunUITheme {
    var background, foreground, card, muted, mutedForeground, primary, primaryForeground: Color
    var secondary, border, input, ring, destructive, spot, spotForeground, success: Color

    static func resolve(_ scheme: ColorScheme) -> SunUITheme {
        scheme == .dark
            ? SunUITheme(background: Color(hex: 0x0a0a0a), foreground: Color(hex: 0xfafafa), card: Color(hex: 0x171717), muted: Color(hex: 0x262626), mutedForeground: Color(hex: 0xa1a1a1), primary: Color(hex: 0xe5e5e5), primaryForeground: Color(hex: 0x171717), secondary: Color(hex: 0x262626), border: Color.white.opacity(0.10), input: Color.white.opacity(0.15), ring: Color(hex: 0x737373), destructive: Color(hex: 0xff6467), spot: Color(hex: 0xe5e5e5), spotForeground: Color(hex: 0x171717), success: Color(hex: 0x4cd68a))
            : SunUITheme(background: Color(hex: 0xffffff), foreground: Color(hex: 0x0a0a0a), card: Color(hex: 0xffffff), muted: Color(hex: 0xf5f5f5), mutedForeground: Color(hex: 0x737373), primary: Color(hex: 0x171717), primaryForeground: Color(hex: 0xfafafa), secondary: Color(hex: 0xf5f5f5), border: Color(hex: 0xe5e5e5), input: Color(hex: 0xe5e5e5), ring: Color(hex: 0xa1a1a1), destructive: Color(hex: 0xe7000b), spot: Color(hex: 0x171717), spotForeground: Color(hex: 0xfafafa), success: Color(hex: 0x1f9d55))
    }
}

private struct SunUIThemeOverrideKey: EnvironmentKey {
    static let defaultValue: SunUITheme? = nil
}

extension EnvironmentValues {
    var sunuiThemeOverride: SunUITheme? {
        get { self[SunUIThemeOverrideKey.self] }
        set { self[SunUIThemeOverrideKey.self] = newValue }
    }
    /// Follows the colour scheme unless an override is set.
    var sunuiTheme: SunUITheme {
        get { sunuiThemeOverride ?? SunUITheme.resolve(colorScheme) }
        set { sunuiThemeOverride = newValue }
    }
}
