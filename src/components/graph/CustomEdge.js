import React from 'react';
import {getBezierPath, getMarkerEnd} from 'react-flow-renderer';

export default function CustomEdge({
                                     id,
                                     sourceX,
                                     sourceY,
                                     targetX,
                                     targetY,
                                     sourcePosition,
                                     targetPosition,
                                     style = {},
                                     arrowHeadType,
                                     markerEndId,
                                   }) {
  let edgePath;
  if (sourceX > targetX) {
    edgePath = myGetBezierPathRightLeft(sourceX, sourceY, targetX, targetY);
  } else {
    edgePath = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }
  // console.log("[CustomEdge] ID: ", id, " edgePath: ", edgePath);
  const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);

  return (
    <>
      <path id={id} style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} />
    </>
  );
}

const myGetBezierPathRightLeft = (sourceX, sourceY, targetX, targetY) => {
  const [centreX, centreY] = getCenter(sourceX, sourceY, targetX, targetY);

  const bSourceX = sourceX + 50;
  const bTargetX = targetX - 50;
  const bCentreX = sourceX + 100;
  // console.log(sourceX, bSourceX, targetY, bTargetX);

  return `M${sourceX},${sourceY} C${bSourceX},${sourceY} ${bCentreX},${centreY} ${centreX},${centreY} S${bTargetX},${targetY} ${targetX},${targetY}`;
}

const getCenter = (sourceX, sourceY, targetX, targetY) => {
  const xOffset = Math.abs(targetX - sourceX) / 2;
  const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;

  const yOffset = Math.abs(targetY - sourceY) / 2;
  const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;

  return [centerX, centerY, xOffset, yOffset];
}
