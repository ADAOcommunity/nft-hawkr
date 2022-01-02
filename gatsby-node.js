const metadata = require("./metadata.json");
const initialOrder = require("./order.json");

const getSpacebudz = () => {
    return Object.keys(metadata).map((id) => {
      const type = metadata[id].type;
      const gadgets = metadata[id].traits;
      const image =
        "https://ipfs.blockfrost.dev/ipfs/" +
        metadata[id].image.split("ipfs://")[1];
      return {
        id,
        image,
        type,
        gadgets,
      };
    });
};

exports.onCreateWebpackConfig = ({ actions }) => {
    actions.setWebpackConfig({
        experiments: {
            asyncWebAssembly: true,
        },
    });
};

exports.createPages = async ({ actions: { createPage } }) => {
    // const spacebudz = getSpacebudz();
    createPage({
      path: `/trade`,
      component: require.resolve("./src/templates/offer.js"),
      context: {},
    });
  };