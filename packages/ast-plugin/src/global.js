let GlobalConfig = {
  typeKey: 'type',
  childrenKey: 'children',
};

export const setGlobalConfig = config => {
  GlobalConfig = config;
};

export const getGlobalConfig = () => GlobalConfig;
