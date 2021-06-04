import React, {memo} from "react";
import {Handle, Position} from "react-flow-renderer";
import NodeButtons from "./NodeButtons";

const DefaultNode = ({ data, isConnectable, targetPosition = Position.Top, sourcePosition = Position.Bottom }) => {
  return (
    <div>
      <Handle type="target" position={targetPosition} isConnectable={isConnectable} />
      {data.label}<p></p>
      <NodeButtons data={data} />
      <Handle type="source" position={sourcePosition} isConnectable={isConnectable} />
    </div>
  );
};

export default memo(DefaultNode);
