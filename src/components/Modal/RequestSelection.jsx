import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  NumberInput,
  NumberInputField,
  Flex,
  Image,
  Heading,
  Box,
  Button,
  Input,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  InfoIcon,
  WarningIcon,
} from "@chakra-ui/icons";
import { fromAscii } from "../../cardano/market/utils";
import { UnitDisplay } from "../UnitDisplay";
import { useStoreActions, useStoreState } from "easy-peasy";
import Loader from "../../cardano/loader";
import secrets from "../../secrets";//PROJECT_ID

const toUnit = (amount, decimals = 6) => {
  const result = parseFloat(amount.replace(/[,\s]/g, ""))
    .toLocaleString("en-EN", { minimumFractionDigits: decimals })
    .replace(/[.,\s]/g, "");
  if (!result) return "0";
  else if (result == "NaN") return "0";
  return result;
};

const addressToBech32 = async () => {
  if(window.cardano.isEnabled()) {
    await Loader.load();
    const address = (await window.cardano.getUsedAddresses())[0];
    return Loader.Cardano.Address.from_bytes(
      Buffer.from(address, "hex")
    ).to_bech32();
  } else {
    return ""
  }
};

const blockfrostRequest = async (endpoint, headers, body) => {
  return await fetch('https://cardano-testnet.blockfrost.io/api/v0' + endpoint, {
    headers: {
      project_id: secrets.PROJECT_ID,
      ...headers,
      "User-Agent": "cardano-escrow",
    },
    method: body ? "POST" : "GET",
    body,
  }).then((res) => res.json());
}

const getAllAssets = async (addr) => {
  if(addr === '') return []
  const utxos = await blockfrostRequest(`/addresses/${addr}/utxos`)
  console.log(utxos)
  let assetsNameList = []
  utxos.forEach((utxo) => {
    utxo.amount.forEach((amnt) => {
      if(amnt.unit !== 'lovelace' && !assetsNameList.includes(amnt.unit)) {
        assetsNameList.push(amnt.unit)
      }
    })
  })

  const assets = async () => { 
    return Promise.all(assetsNameList.map(async (assetEncoded) => {
      const asset = await blockfrostRequest(`/assets/${assetEncoded}`)
      if(asset.onchain_metadata && asset.onchain_metadata.name && asset.onchain_metadata.image) {
        return { name: asset.onchain_metadata.name, image: asset.onchain_metadata.image, encodedFullName: assetEncoded}
      }
  }))}
  // assets.forEach( asset => asset.then((val) => {console.log(val)}))
  return assets()
}



const isBrowser = () => typeof window !== "undefined";

const RequestSelection = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const addRequest = useStoreActions(
      (actions) => actions.requests.addRequest
    );
    let [policy, setPolicy] = React.useState("");
    let [tName, setTName] = React.useState("");
    let [tNum, setTNum] = React.useState('0');
    let [walletAssets, setWalletAssets] = React.useState([{}]);
   

    const toast = useToast();

    const PolicyInput = () => {
      [policy, setPolicy] = React.useState("");
      const handleChange = event => setPolicy(event.target.value);
    
      return (
        <>
          <Input
            value={policy}
            onChange={handleChange}
            placeholder="Policy ID"
          />
        </>
      );
    };
    
    const TokenNameInput = () => {
      [tName, setTName] = React.useState("");
      const handleChange = event => setTName(event.target.value);
    
      return (
        <>
          <Input
            value={tName}
            onChange={handleChange}
            placeholder="Token Name"
          />
        </>
      );
    };

    const loadWalletAssets = async () => {
      const addr1 = await addressToBech32()
      if(addr1){ 
        return await getAllAssets(addr1)
      }
    }
    
    const NumberOfAsset = () => {
      [tNum, setTNum] = React.useState('0');
      const parse = (val) => val.replace(/^\$/, '')
    
      return (
        <NumberInput
          onChange={(valueString) => setTNum(parse(valueString))}
          value={tNum}
        >
          <NumberInputField />
        </NumberInput>
      )
    }
    
    const chooseAsset = (asName) => {
      console.log("chooseAsset")
      console.log(asName)
      var ast = walletAssets.find(wa => typeof(wa) !== "undefined" && wa.name == asName)
      if(ast && ast.name && ast.encodedFullName) {
        setTName(ast.name)
        setPolicy(ast.encodedFullName.substring(0,56))
      }
    }

    const addAssets = () => {
      addRequest({ // TODO - We need to make this use unit and quantity as the offer function expects so that we can shoot it over effectively. That way it converts nicely.
        // TODO - We may also want to take into consideration ADA values here without indvidiuals inputting the policy "lovelace" with no token name will give you ada.
        // 1/1M of an ADA.
        unit: policy + fromAscii(tName),
        quantity: tNum
      })
    }

    const getImage = (asset) => {
      if(asset != '') {
        return `https://ipfs.blockfrost.dev/ipfs/${asset.replace("ipfs://")}` 
      } else {
        return "/somedefaultpic.png"
      }
    }

    return (
      <>
        <Button onClick={onOpen}>Select Assets to Request</Button>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add an asset that you will receive.</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <PolicyInput/>
              <TokenNameInput/>
              <NumberOfAsset/>
              <p>Please input the number desired above. This form is for your requested value.</p>
              <>
                <Button onClick={() => loadWalletAssets().then(data => {
                setWalletAssets(data)
                console.log(walletAssets)
                })}>Load assets from a wallet</Button>
                <SimpleGrid maxH="500px" w="400px" justifyContent="center" columns={2} overflowX={"hidden"} overflowY="scroll">
                  {walletAssets.filter(x => typeof(x) !== "undefined" && x.name).map((asset) => (
                      <Flex w="150px" direction={"column"} p={1} _hover={{cursor: "pointer"}} onClick={() => chooseAsset(asset.name)}>
                        <Image src={getImage(asset.image)} w="150px" h="150px"></Image>
                        <Flex mx="auto" my={1}>{asset.name}</Flex>
                        {/* <Heading as="h4" mx="auto" my={1}>{asset.name}</Heading> */}
                      </Flex>
                  ))}
                </SimpleGrid>
              </>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme='blue' mr={3} onClick={onClose}>
                Close
              </Button>
              <Button variant='ghost' onClick={addAssets}>Add Asset to Offer</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }

export default RequestSelection;
