import React, {memo} from 'react';
import NodeButtons from "./NodeButtons";
import './SoloNode.css';

const SoloNode = ({ data }) => {
  return (
    <div>
      {data.label}<p></p>
      <NodeButtons data={data} />
    </div>
  );
};

export default memo(SoloNode);
