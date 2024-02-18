const { ProductModel } = require("../../model/productModel");
const { SubCatModel, CatModel } = require("../../model/categoryModel");
const { get } = require("../../routers/userRoute");
const { CartModel } = require("../../model/cartModel");
const { getUserId, getCartQty } = require("../../config/userConfig");
const {CouponModel} = require('../../model/couponModel');
const { UserModel } = require("../../model/usersModel");
const {WishlistModel} = require('../../model/wishlistModel')


const viewAllProducts = async (req, res) => {
  try {
    const isAuthenticated = req.cookies.userAccessToken || false;
    const userId = getUserId(req.cookies.userAccessToken)
    const searchKey = req.query.searchKey;
    const wishlist = await WishlistModel.findOne({userId})
    const pageNumber = parseInt(req.params.pageNumber || 0);
    const productsPerPage = 3;
    const totalPages = Math.ceil(await (ProductModel.countDocuments({
      isListed: true,
      productName: { $regex: new RegExp(searchKey, 'i') }
    })) / productsPerPage);
    const allProducts = await ProductModel
      .find({
        isListed: true,
        productName: { $regex: new RegExp(searchKey, 'i') },
        stockQty: { $gt: 0 }
      })
      .skip(pageNumber * productsPerPage)
      .limit(productsPerPage)
      .populate('appliedOffer');
    const mainCat = await CatModel.find({});
    const userCart = await CartModel.find({ userId: userId });


    cartItems = userCart[0]?.items.map((item) => {
      return item?.productId.toString();
    });
    function getCategory(category) {
      return SubCatModel.find({ category: `${category}` });
    }

    const boysCat = await getCategory("Boys");
    const girlsCat = await getCategory("Girls");
    const uniCat = await getCategory("Unisex");
    const cartQty = await getCartQty(userId)



    res.render("./user/products", {
      allProducts: allProducts,
      mainCat: mainCat,
      boysCat: boysCat,
      girlsCat: girlsCat,
      uniCat: uniCat,
      isAuthenticated,
      cartQty,
      userId,
      cartItems,
      pageNumber,
      totalPages,
      wishlist: wishlist?.products
    });
    } catch (error) {
      console.log(error)
      res.render('./user/404')
    }
};

const singleProduct = async (req, res) => {
  try {
    const isAuthenticated = req.cookies.userAccessToken || false;
    const userId = getUserId(req.cookies.userAccessToken);
    const prodId = req.params.prodId;
    const cartQty = await getCartQty(userId);
    let user = await UserModel.findOne({_id:userId})
      
    if(user && user?.refferalCode){
        var coupons = await CouponModel.find({})
    }else{
        var coupons = await CouponModel.find({couponType:"General"})
    }
    const product = await ProductModel.findOne({ _id: prodId }).populate('appliedOffer');
    const userCart = await CartModel.find({ userId: userId });
     
    cartItems = userCart[0]?.items.map((item) => {
      return item?.productId.toString();
    });
   
    res.render("./user/singleProd", {
      product: product,
      isAuthenticated,
      userId,
      cartQty,
      coupons
    });
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }

};

const categorisedProduct = async (req, res) => {
  try {
    const isAuthenticated = req.cookies.userAccessToken || false;
    const userId = getUserId(req.cookies.userAccessToken);
    const catName = req.params.catName;
    const subCatName = req.params.subCatName=='All'? {$exists:true} : req.params.subCatName;
    
    const cartQty = req.cookies.cartQty
    const pageNumber = parseInt(req.params.pageNumber || 0);
    const productsPerPage = 3;
    const wishlist = await WishlistModel.findOne({userId})
    const totalPages = Math.ceil(await (ProductModel.countDocuments({
      isListed: true, category: catName, subCategory: subCatName
    })) / productsPerPage);
    const allProducts = await ProductModel
      .find({ category: catName, subCategory: subCatName, isListed: true })
      .skip(pageNumber * productsPerPage)
      .limit(productsPerPage);

    const userCart = await CartModel.find({ userId: userId });
    const mainCat = await CatModel.find({});
    const boysCat = await SubCatModel.find({ category: "Boys" });
    const girlsCat = await SubCatModel.find({ category: "Girls" });
    const uniCat = await SubCatModel.find({ category: "Unisex" });

    cartItems = userCart[0]?.items.map((item) => {
      return item?.productId.toString();
    });


    res.render("./user/products", {
      allProducts,
      mainCat: mainCat,
      boysCat: boysCat,
      girlsCat: girlsCat,
      uniCat: uniCat,
      isAuthenticated,
      cartQty,
      totalPages,
      pageNumber,
      cartItems,
      wishlist: wishlist?.products
    });
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
  
};

const searchProducts = async (req, res) => {
  try {
    const searchKey = req.params.searchKey;

    const products = await ProductModel.find({
      productName: { $regex: new RegExp(searchKey, 'i') }
    })
    res.send(products);

  } catch (err) {
    console.log(error);
    res.render('./user/404')
  }
}


module.exports = {
  viewAllProducts,
  singleProduct,
  categorisedProduct,
  searchProducts
};
