import React, {memo} from 'react';
import './Legend.css';

const Legend = ({showLegend}) => {
  return (
    <>
      {showLegend && (
        <div class="legend">
          <div className="wrapper">
            <div>
              <div className="legend-node-unscheduled"/>
            </div>
            <div className="label">Unscheduled</div>
            <div>
              <div className="legend-node-selected"/>
            </div>
            <div className="label">Selected</div>
            <div>
              <div className="legend-node-excluded"/>
            </div>
            <div className="label">Excluded</div>
            <div>
              <div className="legend-node-fork"/>
            </div>
            <div className="label">Course Choice</div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(Legend);
