package storage

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Service struct {
	Client        *s3.Client
	PresignClient *s3.PresignClient
	BucketName    string
}

func NewS3Service() (*S3Service, error) {
	region := os.Getenv("S3_REGION")
	endpoint := os.Getenv("S3_ENDPOINT")
	bucket := os.Getenv("S3_BUCKET_NAME")

	accessKey := os.Getenv("MINIO_ROOT_USER")
	secretKey := os.Getenv("MINIO_ROOT_PASSWORD")

	if region == "" || bucket == "" {
		return nil, fmt.Errorf("S3 configuration missing: ensure S3_REGION and S3_BUCKET_NAME are set")
	}

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		if endpoint != "" {
			o.BaseEndpoint = aws.String(endpoint)
		}
		if strings.Contains(endpoint, "localhost") {
			o.UsePathStyle = true
		}
	})

	presignClient := s3.NewPresignClient(client)

	return &S3Service{
		Client:        client,
		PresignClient: presignClient,
		BucketName:    bucket,
	}, nil
}

func (s *S3Service) GeneratePresignedUploadURL(key string) (string, error) {
	expiration := 5 * time.Minute

	presignedRequest, err := s.PresignClient.PresignPutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(s.BucketName),
		Key:    aws.String(key),
	}, func(o *s3.PresignOptions) {
		o.Expires = expiration
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedRequest.URL, nil
}
