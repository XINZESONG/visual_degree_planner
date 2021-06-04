import React, {memo} from 'react';
import {useStoreActions, useStoreState} from "react-flow-renderer";
import ReactTooltip from "react-tooltip";
import {
  DeleteOutlined,
  ExpandOutlined,
  InfoCircleOutlined,
  LockOutlined,
  MinusOutlined,
  NodeIndexOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  ShareAltOutlined,
  UnlockOutlined
} from "@ant-design/icons";
import 'antd/dist/antd.css';
import './CustomControls.css';

export const ControlViewsEnum = { LEGEND: "legend", SEARCH: "search" };

const CustomControls = ({
                          style,
                          showZoom = true,
                          showFitView = true,
                          showInteractive = false,
                          onZoomIn,
                          onZoomOut,
                          onFitView,
                          onInteractiveChange,
                          className,
                          // Custom controls
                          showCourseInfo = true,
                          showClearSelection = true,
                          showStickyHighlights = false,
                          showLegend = true,
                          showSearch = true,
                          onShowCourseInfo,
                          onClearSelection,
                          onStickyHighlights,
                          isStickyHighlights,
                          onShowLegend,
                          onShowSearch
                        }) => {
  const setInteractive = useStoreActions((actions) => actions.setInteractive);
  const fitView = useStoreActions((actions) => actions.fitView);
  const zoomIn = useStoreActions((actions) => actions.zoomIn);
  const zoomOut = useStoreActions((actions) => actions.zoomOut);

  const isInteractive = useStoreState((s) => s.nodesDraggable && s.nodesConnectable && s.elementsSelectable);
  const mapClasses = 'react-flow__controls' + ( className !== undefined ? " " + className : "" );

  return (
    <div className={mapClasses} style={style}>
      {showLegend && (
        <>
          <div
            data-tip={true} data-for="legendTip"
            className="react-flow__controls-button react-flow__controls-legend"
            onClick={() => {
              if (onShowLegend) {
                onShowLegend();
              }
            }}
          >
            <QuestionCircleOutlined />
          </div>
          <ReactTooltip id="legendTip" place="top" effect="solid">
            Show Legend
          </ReactTooltip>
        </>
      )}
      {showStickyHighlights && (
        <>
          <div
            data-tip={true} data-for="stickyHighlightsTip"
            className="react-flow__controls-button react-flow__controls-stickyhighlights"
            onClick={() => {
              if (onStickyHighlights) {
                onStickyHighlights();
              }
            }}
          >
            { isStickyHighlights ? <ShareAltOutlined /> : <NodeIndexOutlined /> }
          </div>
          <ReactTooltip id="stickyHighlightsTip" place="top" effect="solid">
            Keep/Hide Recent Edges
          </ReactTooltip>
        </>
      )}
      {showCourseInfo && (
        <>
          <div
            data-tip={true} data-for="courseInfoTip"
            className="react-flow__controls-button react-flow__controls-info"
            onClick={() => {
              if (onShowCourseInfo) {
                onShowCourseInfo();
              }
            }}
          >
            <InfoCircleOutlined />
          </div>
          <ReactTooltip id="courseInfoTip" place="top" effect="solid">
            Show Requirements for Selected
          </ReactTooltip>
        </>
      )}
      {showSearch && (
        <>
          <div
            data-tip={true} data-for="searchTip"
            className="react-flow__controls-button react-flow__controls-search"
            onClick={() => {
              if (onShowSearch) {
                onShowSearch();
              }
            }}
          >
            <SearchOutlined />
          </div>
          <ReactTooltip id="searchTip" place="top" effect="solid">
            Highlight a Course
          </ReactTooltip>
        </>
      )}
      {showZoom && (
        <>
          <div className="controls-separator" />
          <div
            data-tip={true} data-for="zoomInTip"
            className="react-flow__controls-button react-flow__controls-zoomin"
            onClick={() => {
              zoomIn();
              if (onZoomIn) {
                onZoomIn();
              }
            }}
          >
            <PlusOutlined />
          </div>
          <ReactTooltip id="zoomInTip" place="top" effect="solid">
            Zoom In
          </ReactTooltip>
          <div
            data-tip={true} data-for="zoomOutTip"
            className="react-flow__controls-button react-flow__controls-zoomout"
            onClick={() => {
              zoomOut();
              if (onZoomOut) {
                onZoomOut();
              }
            }}
          >
            <MinusOutlined />
          </div>
          <ReactTooltip id="zoomOutTip" place="top" effect="solid">
            Zoom Out
          </ReactTooltip>
        </>
      )}
      {showFitView && (
        <>
          <div
            data-tip={true} data-for="fitViewTip"
            className="react-flow__controls-button react-flow__controls-fitview"
            onClick={() => {
              fitView({ padding: 0.1 });
              if (onFitView) {
                onFitView();
              }
            }}
          >
            <ExpandOutlined />
          </div>
          <ReactTooltip id="fitViewTip" place="top" effect="solid">
            Fit to View
          </ReactTooltip>
        </>
      )}
      {showInteractive && (
        <>
          <div
            data-tip={true} data-for="interactiveTip"
            className="react-flow__controls-button react-flow__controls-interactive"
            onClick={() => {
              setInteractive(!isInteractive);
              if (onInteractiveChange) {
                onInteractiveChange(!isInteractive);
              }
            }}
          >
            {isInteractive ? <UnlockOutlined /> : <LockOutlined />}
          </div>
          <ReactTooltip id="interactiveTip" place="top" effect="solid">
            Enable/Disable Interactive Graph
          </ReactTooltip>
        </>
      )}
      {showClearSelection && (
        <>
          <div className="controls-separator" />
          <div
            data-tip={true} data-for="clearSelectionTip"
            className="react-flow__controls-button react-flow__controls-clearselection"
            onClick={() => {
              if (onClearSelection) {
                onClearSelection();
              }
            }}
          >
            <DeleteOutlined />
          </div>
          <ReactTooltip id="clearSelectionTip" place="top" effect="solid">
            Clear Selection
          </ReactTooltip>
        </>
      )}
    </div>
  );
};

export default memo(CustomControls);
