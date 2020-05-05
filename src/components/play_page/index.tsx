import React from 'react';

import LevelObject from '../../../server/Level_Object';

interface propObject {
    levelObject: LevelObject
};

const Play_Page = ({levelObject} : propObject) => {
    console.log(levelObject);

    return (
        <div>
            play page
        </div>
    );
};

export default Play_Page;