import SwiftUI

/// Reproduces the React demo: a filter card with a price range and a minimum rating.
struct RangeSliderDemo: View {
    @Environment(\.sunuiTheme) private var theme
    @State private var price: ClosedRange<Double> = 20...120
    @State private var rating: Double = 4

    private var count: Int {
        let raw = (price.upperBound - price.lowerBound) * 1.4 - (rating - 3) * 30
        return max(0, Int((raw + 0.5).rounded(.down)))
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("Filter")
                    .font(.system(size: 16, weight: .semibold))
                    .tracking(-0.025 * 16)
                    .foregroundStyle(theme.foreground)
                Spacer(minLength: 0)
                Text("\(count) products")
                    .font(.system(size: 14))
                    .monospacedDigit()
                    .foregroundStyle(theme.mutedForeground)
            }
            .padding(.bottom, 24)

            VStack(spacing: 32) {
                RangeSlider(
                    value: $price,
                    min: 0,
                    max: 200,
                    step: 5,
                    minGap: 10,
                    format: { "$\(RangeSlider.defaultFormat($0))" },
                    label: "Price",
                    name: "price",
                    thumbLabels: ["Lowest price", "Highest price"]
                )
                RangeSlider(
                    value: $rating,
                    min: 1,
                    max: 5,
                    step: 0.5,
                    format: { String(format: "%.1f ★", $0) },
                    ticks: .count(8),
                    label: "Minimum rating",
                    thumbLabels: ["Minimum rating"]
                )
            }
        }
        .padding(24)
        .frame(maxWidth: 384)
        .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(theme.background))
        .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(theme.border, lineWidth: 1))
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.background.ignoresSafeArea())
    }
}

#Preview {
    RangeSliderDemo()
}
