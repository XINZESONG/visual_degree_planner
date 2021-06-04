import React, { Component } from 'react';
import {memo} from "react";
import { Input } from 'antd';
import './GraphSearch.css';

const GraphSearch = ({ showGraphSearch, graphSearch }) => {

  const onSearch = (value, e) => {
    console.log("SEARCH: ", value, e);
    console.log(graphSearch);
    graphSearch(value);
  }

  return (
    <>
      {showGraphSearch && (
        <div className="graph-search">
          <Input.Search placeholder="Enter course" onSearch={onSearch} size="small" />
        </div>
      )}
    </>
  );
}

export default memo(GraphSearch);
