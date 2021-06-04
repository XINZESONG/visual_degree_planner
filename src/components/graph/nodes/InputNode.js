import React, {memo} from "react";
import {Handle, Position} from "react-flow-renderer";
import NodeButtons from "./NodeButtons";

const InputNode = ({ data, isConnectable, sourcePosition = Position.Bottom }) => {
  return (
    <div>
      {data.label}<p></p>
      <NodeButtons data={data} />
      <Handle type="source" position={sourcePosition} isConnectable={isConnectable} />
    </div>
  );
};

export default memo(InputNode);
