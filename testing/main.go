package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	engine := gin.New()
	r := engine.Group("/")
	r.Static("/", "../frontend")
	err := engine.Run("0.0.0.0:8080")
	if err != nil {
		panic(err)
	}

	// type thing struct {
	// 	firstName string `json:"first-name"`
	// 	lastName  string `json:"last-name"`
	// }
	// storage := make(map[string]thing)
	// engine := gin.New()
	// r := engine.Group("/")
	// r.Static("/", "../frontend")
	// r.POST("/login", func(c *gin.Context) {
	// 	t := thing{}
	// 	err := c.BindWith(&t, binding.JSON)
	// 	fmt.Println(err.Error())
	// 	storage["thing1"] = t
	// })
	// r.GET("/blah", func(c *gin.Context) {
	// 	c.String(200, storage["thing1"].firstName)
	// })
	// err := engine.Run("0.0.0.0:8080")
	// if err != nil {
	// 	panic(err)
	// }

}
