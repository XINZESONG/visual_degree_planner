import React, {memo} from "react";
import {Handle, Position} from "react-flow-renderer";
import NodeButtons from "./NodeButtons";

const OutputNode = ({ data, isConnectable, targetPosition = Position.Top }) => {
  return (
    <div>
      <Handle type="target" position={targetPosition} isConnectable={isConnectable} />
      {data.label}<p></p>
      <NodeButtons data={data} />
    </div>
  );
};

export default memo(OutputNode);
