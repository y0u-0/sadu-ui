import { OTPInput, OTPInputGroup, OTPInputSeparator, OTPInputSlot } from "@ui-sdk/react/otp-input"
import { Fragment, type ComponentProps, type ReactElement } from "react"
import type { Grid } from "./motifs"
import { partClass } from "./sadu-field"
import { Eye } from "./parts"
import { Weave } from "./weave"
import "./styles/sadu-otp-input.css"

type SaduOTPInputProps = Omit<ComponentProps<typeof OTPInput>, "maxLength" | "children"> & {
  groups?: readonly number[]
  dye?: string
}

const STRIP: Grid = ["kkkkkk", "xx..xx", ".xx..x"]

function slotRuns(groups: readonly number[]): number[][] {
  let start = 0
  return groups.map((size) => {
    const run = Array.from({ length: size }, (_, offset) => start + offset)
    start += size
    return run
  })
}

function SaduOTPInput({ groups = [3, 3], dye = "var(--sadu-madder-cloth)", className, ...props }: SaduOTPInputProps): ReactElement {
  const colors = { ground: "var(--sadu-capsule)", dye: "var(--sadu-capsule-ink)", accent: dye }
  return (
    <OTPInput {...props} maxLength={groups.reduce((sum, size) => sum + size, 0)} className={partClass("sadu-otp", className)}>
      {slotRuns(groups).map((run, index) => (
        <Fragment key={run[0]}>
          {index > 0 && (
            <OTPInputSeparator className="sadu-otp__separator">
              <Eye size={10} tone="separator" />
            </OTPInputSeparator>
          )}
          <OTPInputGroup className="sadu-otp__group">
            {run.map((slot) => (
              <OTPInputSlot key={slot} index={slot} className="sadu-otp__slot">
                {(state) => (
                  <>
                    {state.char && (
                      <span key={state.char} className="sadu-otp__char">
                        {state.char}
                      </span>
                    )}
                    {state.hasFakeCaret && <span className="sadu-otp__caret" />}
                    <span className="sadu-otp__strip">
                      <Weave level="stitch" grid={STRIP} colors={colors} offset={slot * 9} />
                    </span>
                  </>
                )}
              </OTPInputSlot>
            ))}
          </OTPInputGroup>
        </Fragment>
      ))}
    </OTPInput>
  )
}

export { SaduOTPInput }
export type { SaduOTPInputProps }
