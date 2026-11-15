import "./styles/warp-timeline.css"
import {
  Timeline,
  TimelineConnector,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@ui-sdk/react/timeline"
import type { ComponentProps, ReactElement } from "react"
import { mergeClass } from "./merge-class"
import { Eye } from "./parts"

type WarpTimelineProps = ComponentProps<typeof Timeline>
type WarpTimelineItemProps = ComponentProps<typeof TimelineItem>
type WarpTimelineMarkerProps = ComponentProps<typeof TimelineMarker> & { failed?: boolean }
type WarpTimelineConnectorProps = Omit<ComponentProps<typeof TimelineConnector>, "children">
type WarpTimelineTitleProps = ComponentProps<typeof TimelineTitle>
type WarpTimelineTimeProps = ComponentProps<typeof TimelineTime>
type WarpTimelineDescriptionProps = ComponentProps<typeof TimelineDescription>

function WarpTimeline({ className, ...props }: WarpTimelineProps): ReactElement {
  return <Timeline {...props} className={mergeClass("sadu-timeline", className)} />
}

function WarpTimelineItem({ className, ...props }: WarpTimelineItemProps): ReactElement {
  return <TimelineItem {...props} className={mergeClass("sadu-timeline__item", className)} />
}

function WarpTimelineMarker({ failed = false, className, children, ...props }: WarpTimelineMarkerProps): ReactElement {
  return (
    <TimelineMarker {...props} className={mergeClass("sadu-timeline__marker", className)} data-failed={failed || undefined}>
      {children ??
        (failed ? (
          <span className="sadu-timeline__teeth" />
        ) : (
          <>
            <Eye size={10} className="sadu-timeline__eye" />
            <Eye size={15} className="sadu-timeline__eye sadu-timeline__eye--current" />
            <Eye size={10} state="off" className="sadu-timeline__eye sadu-timeline__eye--upcoming" />
          </>
        ))}
    </TimelineMarker>
  )
}

function WarpTimelineConnector({ className, ...props }: WarpTimelineConnectorProps): ReactElement {
  return (
    <TimelineConnector {...props} className={mergeClass("sadu-timeline__connector", className)}>
      <span className="sadu-timeline__spun" />
    </TimelineConnector>
  )
}

function WarpTimelineTitle({ className, ...props }: WarpTimelineTitleProps): ReactElement {
  return <TimelineTitle {...props} className={mergeClass("sadu-timeline__title", className)} />
}

function WarpTimelineTime({ className, ...props }: WarpTimelineTimeProps): ReactElement {
  return <TimelineTime {...props} className={mergeClass("sadu-timeline__time", className)} />
}

function WarpTimelineDescription({ className, ...props }: WarpTimelineDescriptionProps): ReactElement {
  return <TimelineDescription {...props} className={mergeClass("sadu-timeline__description", className)} />
}

export {
  WarpTimeline,
  WarpTimelineConnector,
  WarpTimelineDescription,
  WarpTimelineItem,
  WarpTimelineMarker,
  WarpTimelineTime,
  WarpTimelineTitle,
}
export type {
  WarpTimelineConnectorProps,
  WarpTimelineDescriptionProps,
  WarpTimelineItemProps,
  WarpTimelineMarkerProps,
  WarpTimelineProps,
  WarpTimelineTimeProps,
  WarpTimelineTitleProps,
}
